import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { NangoService } from '../nango/nango.service';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';

const MODEL = 'gpt-4o-mini';

/** Result of executing a tool. Returned to the model as tool message content. */
export type ToolExecutionResult = {
  content: string;
  status: 'success' | 'failure';
  statusReason?: string;
};

/** One chat tool: OpenAI definition + executor. Add entries here to register new tools. */
export type ChatToolDefinition = {
  definition: OpenAI.Chat.Completions.ChatCompletionTool;
  execute: (
    args: string,
    conversationId: string,
  ) => Promise<ToolExecutionResult>;
};

/** Built-in tools that are always available, regardless of agents. */
function getDefaultChatTools(): ChatToolDefinition[] {
  return [
    {
      definition: {
        type: 'function',
        function: {
          name: 'get_today_date',
          description:
            "Get today's date in ISO format (YYYY-MM-DD). Use when the user asks for the current date or today's date.",
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      execute: async (): Promise<ToolExecutionResult> => {
        const date = new Date().toISOString().slice(0, 10);
        return { content: JSON.stringify({ date }), status: 'success' };
      },
    },
  ];
}

/**
 * Deep-merge streamed tool_calls deltas. The API sends partial updates (e.g.
 * first chunk: function.name, later chunk: function.arguments). Shallow merge
 * would overwrite function and drop name. We merge each tool call and its
 * function sub-object so all fields are preserved.
 */
function mergeToolCallInto(
  acc: Record<string, unknown>,
  delta: { index?: number; id?: string; type?: string; function?: Record<string, unknown> },
) {
  const existing = acc as {
    id?: string;
    type?: string;
    function?: Record<string, unknown>;
  };
  if (delta.id !== undefined) existing.id = delta.id;
  if (delta.type !== undefined) existing.type = delta.type;
  if (delta.function != null && typeof delta.function === 'object') {
    existing.function = existing.function ?? {};
    if (typeof existing.function === 'object' && !Array.isArray(existing.function)) {
      if (delta.function.name !== undefined) existing.function.name = delta.function.name;
      if (delta.function.arguments !== undefined) {
        const prev = existing.function.arguments;
        const next = delta.function.arguments;
        existing.function.arguments =
          typeof prev === 'string' && typeof next === 'string'
            ? prev + next
            : (next ?? prev);
      }
    }
  }
}

function messageReducer(
  previous: OpenAI.Chat.Completions.ChatCompletionMessage,
  item: ChatCompletionChunk,
): OpenAI.Chat.Completions.ChatCompletionMessage {
  const choice = item.choices[0];
  if (!choice?.delta) return previous;

  const acc = { ...previous } as Record<string, unknown>;
  const delta = choice.delta as Record<string, unknown>;

  for (const [key, value] of Object.entries(delta)) {
    if (value === undefined) continue;
    if (acc[key] === undefined || acc[key] === null) {
      acc[key] = Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : value;
    } else if (typeof acc[key] === 'string' && typeof value === 'string') {
      (acc[key] as string) += value;
    } else if (key === 'tool_calls' && Array.isArray(acc[key]) && Array.isArray(value)) {
      const accArr = acc[key] as Record<string, unknown>[];
      for (const el of value as { index?: number; id?: string; type?: string; function?: Record<string, unknown> }[]) {
        const i = el.index ?? accArr.length;
        if (accArr[i] == null) accArr[i] = {};
        mergeToolCallInto(accArr[i], el);
      }
    } else if (Array.isArray(acc[key]) && Array.isArray(value)) {
      const accArr = acc[key] as unknown[];
      for (const el of value as { index?: number; [k: string]: unknown }[]) {
        const { index, ...rest } = el;
        const i = index ?? accArr.length;
        if (accArr[i] == null) accArr[i] = {};
        (accArr[i] as Record<string, unknown>) = {
          ...(accArr[i] as Record<string, unknown>),
          ...rest,
        };
      }
    } else if (
      typeof acc[key] === 'object' &&
      acc[key] !== null &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      acc[key] = { ...(acc[key] as object), ...(value as object) };
    }
  }

  return acc as unknown as OpenAI.Chat.Completions.ChatCompletionMessage;
}

/** Ensure tool_calls have required id, type, and function.name/arguments for the API. */
function normalizeToolCalls(
  toolCalls: Array<{ id?: string; type?: string; function?: { name?: string; arguments?: string } }>,
): Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> {
  return toolCalls.map((tc) => ({
    type: (tc.type ?? 'function') as 'function',
    id: tc.id ?? `call_${Math.random().toString(36).slice(2, 12)}`,
    function: {
      name: tc.function?.name ?? '',
      arguments: typeof tc.function?.arguments === 'string' ? tc.function.arguments : '{}',
    },
  }));
}

@Injectable()
export class ChatsService {
  private openai: OpenAI | null = null;
  private readonly baseTools: ChatToolDefinition[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly nango: NangoService,
  ) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    if (key?.trim()) this.openai = new OpenAI({ apiKey: key });
    this.baseTools = getDefaultChatTools();
  }

  private getClient(): OpenAI {
    if (!this.openai) throw new Error('OPENAI_API_KEY is not configured');
    return this.openai;
  }

  private async ensureConversationOwnership(
    conversationId: string,
    userId: number,
  ) {
    const conv = await this.prisma.client.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found.');
    if (conv.userId !== userId) throw new NotFoundException('Conversation not found.');
    return conv;
  }

  async listConversationsForUser(userId: number) {
    const list = await this.prisma.client.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { content: true },
        },
      },
    });
    return list.map((c) => ({
      id: c.id,
      updatedAt: c.updatedAt.toISOString(),
      title:
        c.title?.trim() && c.title.trim().length > 0
          ? c.title.trim()
          : c.messages[0]?.content?.slice(0, 80) ?? 'New chat',
    }));
  }

  async getConversationWithMessages(conversationId: string, userId: number) {
    await this.ensureConversationOwnership(conversationId, userId);
    const conv = await this.prisma.client.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { toolExecution: true },
        },
        agents: {
          include: {
            agent: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found.');
    return {
      id: conv.id,
      agentIds: conv.agents.map((ca) => ca.agentId),
      updatedAt: conv.updatedAt.toISOString(),
      agents: conv.agents.map((ca) => ({
        id: ca.agent.id,
        name: ca.agent.name,
      })),
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolExecutionId: m.toolExecutionId ?? undefined,
        toolExecution: m.toolExecution
          ? {
              id: m.toolExecution.id,
              toolName: m.toolExecution.toolName,
              inputJson: m.toolExecution.inputJson,
              outputJson: m.toolExecution.outputJson,
            }
          : undefined,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async createConversationForUser(userId: number) {
    const conv = await this.prisma.client.conversation.create({
      data: { userId },
    });
    return { id: conv.id };
  }

  async getConversationAgents(conversationId: string, userId: number) {
    await this.ensureConversationOwnership(conversationId, userId);
    const conv = await this.prisma.client.conversation.findUnique({
      where: { id: conversationId },
      include: {
        agents: {
          include: {
            agent: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found.');
    const agentIds = conv.agents.map((ca) => ca.agentId);
    const agents = conv.agents.map((ca) => ({
      id: ca.agent.id,
      name: ca.agent.name,
    }));
    return { agentIds, agents };
  }

  async updateConversationAgents(
    conversationId: string,
    userId: number,
    agentIds: number[],
  ) {
    await this.ensureConversationOwnership(conversationId, userId);

    // Ensure all agents belong to the current user.
    const distinctAgentIds = Array.from(new Set(agentIds));
    if (distinctAgentIds.length) {
      const ownedAgents = await this.prisma.client.agent.findMany({
        where: {
          id: { in: distinctAgentIds },
          userId,
        },
        select: { id: true },
      });
      const ownedIds = new Set(ownedAgents.map((a) => a.id));
      const invalidIds = distinctAgentIds.filter((id) => !ownedIds.has(id));
      if (invalidIds.length) {
        throw new UnauthorizedException('One or more agents are not accessible.');
      }
    }

    await this.prisma.client.conversationAgent.deleteMany({
      where: { conversationId },
    });

    if (distinctAgentIds.length) {
      await this.prisma.client.conversationAgent.createMany({
        data: distinctAgentIds.map((agentId) => ({
          conversationId,
          agentId,
        })),
      });
    }

    return this.getConversationAgents(conversationId, userId);
  }

  /**
   * Generate and persist a short, contextual conversation title using OpenAI,
   * based on the first user message in the thread.
   */
  private async ensureConversationTitle(
    conversationId: string,
    firstUserMessageContent: string,
  ): Promise<void> {
    // Check if a title already exists or there is more than one user message.
    const conv = await this.prisma.client.conversation.findUnique({
      where: { id: conversationId },
      select: {
        title: true,
        messages: {
          where: { role: 'user' },
          select: { id: true },
        },
      },
    });

    if (!conv) return;
    if (conv.title && conv.title.trim().length > 0) return;
    if (conv.messages.length > 1) return;

    const client = this.getClient();

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You generate concise chat titles for conversation threads. ' +
            'Respond with only the title text, no quotes. ' +
            'Use 5 to 8 words that best summarize the conversation based on the user message.',
        },
        {
          role: 'user',
          content: firstUserMessageContent,
        },
      ],
      max_tokens: 32,
      temperature: 0.3,
    });

    let rawTitle = completion.choices[0]?.message?.content?.trim() ?? '';
    if (!rawTitle) {
      rawTitle = firstUserMessageContent.slice(0, 80);
    }

    // Normalize: strip trailing punctuation and clamp to 8 words.
    const cleaned = rawTitle.replace(/[\s\n]+/g, ' ').replace(/[.!?]+$/g, '').trim();
    const words = cleaned.split(' ').filter(Boolean).slice(0, 8);
    const finalTitle = words.join(' ') || 'New chat';

    await this.prisma.client.conversation.update({
      where: { id: conversationId },
      data: { title: finalTitle },
    });
  }

  async deleteConversationForUser(conversationId: string, userId: number) {
    await this.ensureConversationOwnership(conversationId, userId);
    await this.prisma.client.conversation.delete({
      where: { id: conversationId },
    });
    return { success: true };
  }

  private buildOpenAIMessages(
    dbMessages: {
      role: string;
      content: string;
      tool_call_id?: string;
      tool_calls_json?: unknown;
    }[],
  ): ChatCompletionMessageParam[] {
    const result: ChatCompletionMessageParam[] = [];

    for (const m of dbMessages) {
      if (m.role === 'user') {
        result.push({ role: 'user', content: m.content });
        continue;
      }

      if (m.role === 'assistant') {
        // Historically we may have stored tool_calls and tool messages.
        // To avoid any invariant issues with older data, we only replay
        // the assistant's natural language content and drop any tool_calls.
        result.push({ role: 'assistant', content: m.content });
        continue;
      }

      // Drop historical tool messages from the prompt entirely. Their
      // effects should already be reflected in prior assistant messages,
      // and including them risks violating the OpenAI tools invariants.
      if (m.role === 'tool') {
        continue;
      }

      // Fallback: treat unknown roles as user for robustness.
      result.push({ role: 'user', content: m.content });
    }

    return result;
  }

  private async runTool(
    name: string,
    args: string,
    conversationId: string,
    tools: ChatToolDefinition[],
  ): Promise<ToolExecutionResult> {
    const tool = tools.find(
      (t) => t.definition.type === 'function' && t.definition.function?.name === name,
    );
    if (!tool) {
      return {
        content: JSON.stringify({ error: 'Unknown tool' }),
        status: 'failure',
        statusReason: `Unknown tool: ${name}`,
      };
    }
    try {
      return await tool.execute(args, conversationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: JSON.stringify({ error: message }),
        status: 'failure',
        statusReason: message,
      };
    }
  }

  async streamCompletion(
    conversationId: string,
    userId: number,
    content: string,
    res: Response,
  ): Promise<void> {
    await this.ensureConversationOwnership(conversationId, userId);

    const agentTools = await this.buildToolsForConversation(conversationId, userId);
    const toolMap = new Map<string, ChatToolDefinition>();

    for (const t of this.baseTools) {
      if (t.definition.type === 'function' && t.definition.function?.name) {
        toolMap.set(t.definition.function.name, t);
      }
    }

    for (const t of agentTools) {
      if (t.definition.type === 'function' && t.definition.function?.name) {
        toolMap.set(t.definition.function.name, t);
      }
    }

    const chatTools = Array.from(toolMap.values());

    const userMessage = await this.prisma.client.message.create({
      data: {
        conversationId,
        role: 'user',
        content,
      },
    });

    // If this is the first user message in the thread and no title exists yet,
    // generate a short contextual conversation title and save it.
    await this.ensureConversationTitle(conversationId, content);

    const dbMessages = await this.prisma.client.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true, toolCallId: true, toolCallsJson: true },
    });

    const historyMessages: ChatCompletionMessageParam[] = this.buildOpenAIMessages(
      dbMessages.map((m) => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.toolCallId ?? undefined,
        tool_calls_json: m.toolCallsJson ?? undefined,
      })),
    );

    const systemMessage: ChatCompletionMessageParam = {
      role: 'system',
      content:
        'You are a helpful assistant in a web chat. Whenever formatting will improve clarity, use GitHub-flavored Markdown in your replies: bullet lists, numbered lists, bold/italic, tables, and fenced code blocks (```language ... ```). Keep prose concise and readable.',
    };

    const openaiMessages: ChatCompletionMessageParam[] = [systemMessage, ...historyMessages];

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const write = (obj: object) => {
      res.write(JSON.stringify(obj) + '\n');
      (res as { flush?: () => void }).flush?.();
    };

    const client = this.getClient();
    let fullAssistantContent = '';

    try {
      let messages: ChatCompletionMessageParam[] = [...openaiMessages];

      while (true) {
        const openaiTools = chatTools.length
          ? chatTools.map((t) => t.definition)
          : undefined;

        const stream = await client.chat.completions.create({
          model: MODEL,
          messages,
          ...(openaiTools ? { tools: openaiTools } : {}),
          stream: true,
        });

        let message: Partial<OpenAI.Chat.Completions.ChatCompletionMessage> = {};
        let lastDeltaContent = '';
        let finishReason: string | null = null;

        for await (const chunk of stream) {
          const choice = chunk.choices?.[0];
          if (choice?.finish_reason) finishReason = choice.finish_reason;
          message = messageReducer(
            message as OpenAI.Chat.Completions.ChatCompletionMessage,
            chunk,
          );
          const content = typeof message.content === 'string' ? message.content : '';
          if (content !== lastDeltaContent) {
            const delta = content.slice(lastDeltaContent.length);
            lastDeltaContent = content;
            if (delta) write({ type: 'text', delta });
          }
        }

        fullAssistantContent =
          typeof message.content === 'string' ? message.content : fullAssistantContent;

        if (finishReason !== 'tool_calls' || !message.tool_calls?.length) {
          break;
        }

        const normalizedToolCalls = normalizeToolCalls(message.tool_calls ?? []);
        if (!normalizedToolCalls.length) break;

        // If the model didn't explain what it's about to do, synthesize a short
        // acknowledgement so the user always sees intent before tools run,
        // and so this acknowledgement is persisted in the DB.
        if (!fullAssistantContent.trim()) {
          const firstToolName = normalizedToolCalls[0]?.function.name ?? 'a tool';
          const planText = `I'll use ${firstToolName} to help with that.`;
          fullAssistantContent = planText;
          write({ type: 'text', delta: planText });
        }

        messages.push({
          role: 'assistant',
          content: fullAssistantContent || null,
          tool_calls: normalizedToolCalls,
        } as ChatCompletionMessageParam);

        await this.prisma.client.message.create({
          data: {
            conversationId,
            role: 'assistant',
            content: fullAssistantContent || '',
            toolCallsJson: normalizedToolCalls as unknown as object,
          },
        });

        for (const toolCall of normalizedToolCalls) {
          if (toolCall.type !== 'function') continue;
          const name = toolCall.function?.name ?? '';
          const args = toolCall.function?.arguments ?? '{}';
          const toolCallId = toolCall.id ?? '';

          write({
            type: 'tool_call',
            id: toolCallId,
            name,
            args: typeof args === 'string' ? JSON.parse(args || '{}') : args,
          });

          const inputJson = typeof args === 'string' ? JSON.parse(args || '{}') : args;
          const { content: toolContent, status, statusReason } = await this.runTool(
            name,
            typeof args === 'string' ? args : JSON.stringify(args),
            conversationId,
            chatTools,
          );

          let outputJson: object;
          try {
            outputJson = JSON.parse(toolContent);
          } catch {
            outputJson = { raw: toolContent };
          }
          const execution = await this.prisma.client.toolExecution.create({
            data: {
              conversationId,
              toolName: name,
              inputJson,
              outputJson,
              status,
              statusReason: statusReason ?? null,
            },
          });

          const messageRecord = await this.prisma.client.message.create({
            data: {
              conversationId,
              role: 'tool',
              // Store a compact, user-friendly label instead of raw JSON.
              // The full JSON result lives in ToolExecution.outputJson.
              content: `View result from ${name}`,
              toolCallId: toolCallId,
              toolExecutionId: execution.id,
            },
          });

          write({
            type: 'tool_result',
            id: toolCallId,
            name,
            input: inputJson,
            output: outputJson,
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            content: toolContent,
          });
        }

        fullAssistantContent = '';
      }

      await this.prisma.client.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: fullAssistantContent,
        },
      });

      await this.prisma.client.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    } finally {
      write({ type: 'done' });
      res.end();
    }
  }

  /**
   * Build the set of tools available for a given conversation based on
   * the agents attached to it. If no agents are attached, no tools are used.
   */
  private async buildToolsForConversation(
    conversationId: string,
    userId: number,
  ): Promise<ChatToolDefinition[]> {
    const conv = await this.prisma.client.conversation.findUnique({
      where: { id: conversationId },
      select: {
        userId: true,
        agents: {
          include: {
            agent: {
              include: {
                tools: {
                  include: {
                    integrationAction: {
                      include: {
                        integration: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conv || conv.userId !== userId) {
      throw new NotFoundException('Conversation not found.');
    }

    if (!conv.agents.length) {
      return [];
    }

    const toolsByName = new Map<string, ChatToolDefinition>();

    for (const ca of conv.agents) {
      for (const agentTool of ca.agent.tools) {
        const action = agentTool.integrationAction as any;
        const integration = action.integration as any;
        if (!action || !integration) continue;

        const actionType: 'action' | 'sync' =
          (action.type === 'sync' ? 'sync' : 'action') as 'action' | 'sync';

        const functionName = `integration_action_${action.id}`;
        if (toolsByName.has(functionName)) continue;

        const description =
          action.description ||
          action.actionName ||
          action.actionKey ||
          'Runs an integration action.';

        const rawSchema = action.jsonSchema as
          | OpenAI.Chat.Completions.ChatCompletionTool['function']['parameters']
          | (Record<string, unknown> & { definitions?: Record<string, unknown> })
          | null
          | undefined;

        let parameters: OpenAI.Chat.Completions.ChatCompletionTool['function']['parameters'] =
          { type: 'object', properties: {} };

        if (rawSchema && typeof rawSchema === 'object') {
          // Case 1: standard JSON Schema object at the root.
          if (
            (rawSchema as any).type === 'object' &&
            rawSchema.hasOwnProperty('properties') &&
            typeof (rawSchema as any).properties === 'object'
          ) {
            parameters =
              rawSchema as OpenAI.Chat.Completions.ChatCompletionTool['function']['parameters'];
          } else if (
            (rawSchema as any).definitions &&
            typeof (rawSchema as any).definitions === 'object'
          ) {
            // Case 2: schema only defines models under `definitions`. For actions like Gmail
            // emails, the input model is exposed here (e.g. SyncMetadata_google_mail_emails).
            const defs = (rawSchema as any).definitions as Record<string, any>;
            const keys = Object.keys(defs);

            let chosenDef: any | undefined;

            // Prefer a SyncMetadata_* definition if present (common for Nango sync/action input).
            const syncMetaKey = keys.find((k) => /^SyncMetadata_/i.test(k));

            if (
              syncMetaKey &&
              defs[syncMetaKey]?.type === 'object' &&
              defs[syncMetaKey].hasOwnProperty('properties') &&
              typeof defs[syncMetaKey].properties === 'object'
            ) {
              chosenDef = defs[syncMetaKey];
            } else {
              // Otherwise fall back to the first object-typed definition with properties.
              for (const key of keys) {
                const def = defs[key];
                if (
                  def &&
                  def.type === 'object' &&
                  def.hasOwnProperty('properties') &&
                  typeof def.properties === 'object'
                ) {
                  chosenDef = def;
                  break;
                }
              }
            }

            if (chosenDef) {
              parameters =
                chosenDef as OpenAI.Chat.Completions.ChatCompletionTool['function']['parameters'];
            }
          }
        }

        const definition: OpenAI.Chat.Completions.ChatCompletionTool = {
          type: 'function',
          function: {
            name: functionName,
            description,
            parameters,
          },
        };

        const execute = async (args: string): Promise<ToolExecutionResult> => {
          let parsedArgs: Record<string, unknown>;
          try {
            parsedArgs = args ? (JSON.parse(args) as Record<string, unknown>) : {};
          } catch {
            parsedArgs = { raw: args };
          }

          // Find the active Nango connection for this user + integration.
          const connection = await this.prisma.client.integrationConnection.findFirst({
            where: {
              userId,
              integrationId: integration.id,
              status: 'CONNECTED',
            },
          });

          if (!connection) {
            return {
              content: JSON.stringify({
                error: 'No active connection for this integration.',
              }),
              status: 'failure',
              statusReason: 'No active integration connection',
            };
          }

          const integrationKey: string =
            integration.uniqueKey ?? integration.providerConfigKey ?? integration.provider;

          try {
            let result: unknown;

            if (actionType === 'action') {
              result = await this.nango.triggerAction({
                integrationKey,
                connectionId: connection.nangoConnectionId,
                actionName: action.actionKey,
                input: parsedArgs,
              });
            } else {
              // For syncs, use listRecords to read from the synced data store.
              // Derive the model name from the sync's schema: prefer the primary
              // data model (e.g. GmailEmail) over SyncMetadata_*.
              let model: string = action.actionKey;
              const rawSchema = action.jsonSchema as
                | (Record<string, unknown> & { definitions?: Record<string, unknown> })
                | null
                | undefined;
              if (rawSchema && typeof rawSchema === 'object' && rawSchema.definitions) {
                const defs = rawSchema.definitions as Record<string, any>;
                const keys = Object.keys(defs);
                const candidate = keys.find(
                  (k) =>
                    !/^SyncMetadata_/i.test(k) &&
                    defs[k] &&
                    defs[k].type === 'object',
                );
                if (candidate) {
                  model = candidate;
                }
              }

              result = await this.nango.listRecords({
                providerConfigKey: integrationKey,
                connectionId: connection.nangoConnectionId,
                model,
              });
            }

            // Log the raw result for debugging integration behavior.
            // eslint-disable-next-line no-console
            console.log(
              '[ChatsService] Nango tool result',
              JSON.stringify(
                {
                  type: actionType,
                  integrationKey,
                  actionKey: action.actionKey,
                  connectionId: connection.nangoConnectionId,
                  result,
                },
                null,
                2,
              ),
            );

            return {
              content: JSON.stringify(result ?? {}),
              status: 'success',
            };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            // eslint-disable-next-line no-console
            console.error(
              '[ChatsService] Nango tool error',
              JSON.stringify(
                {
                  type: actionType,
                  integrationKey,
                  actionKey: action.actionKey,
                  connectionId: connection.nangoConnectionId,
                  error: message,
                },
                null,
                2,
              ),
            );
            return {
              content: JSON.stringify({ error: message }),
              status: 'failure',
              statusReason: message,
            };
          }
        };

        toolsByName.set(functionName, { definition, execute });
      }
    }

    return Array.from(toolsByName.values());
  }
}
