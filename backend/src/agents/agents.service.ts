import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAgentsForUser(userId: number) {
    const agents = await this.prisma.client.agent.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
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
    });

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      tools: agent.tools.map((tool) => ({
        id: tool.integrationAction.id,
        actionName:
          tool.integrationAction.actionName ?? tool.integrationAction.actionKey,
        description: tool.integrationAction.description ?? null,
        integrationName:
          tool.integrationAction.integration.displayName ??
          tool.integrationAction.integration.provider,
      })),
    }));
  }

  async listAvailableToolsForUser(userId: number) {
    const connections = await this.prisma.client.integrationConnection.findMany(
      {
        where: {
          userId,
          status: 'CONNECTED',
        },
        include: {
          integration: {
            include: {
              actions: {
                where: {
                  enabled: true,
                },
              },
            },
          },
        },
      },
    );

    const tools: {
      id: number;
      actionName: string;
      description: string | null;
      integrationName: string;
    }[] = [];

    for (const connection of connections) {
      const integration = connection.integration;
      for (const action of integration.actions) {
        tools.push({
          id: action.id,
          actionName: action.actionName ?? action.actionKey,
          description: action.description ?? null,
          integrationName: integration.displayName ?? integration.provider,
        });
      }
    }

    return tools;
  }

  async createAgentForUser(params: {
    userId: number;
    name: string;
    systemPrompt: string;
    toolIds?: number[];
  }) {
    const { userId, name, systemPrompt, toolIds } = params;

    const agent = await this.prisma.client.agent.create({
      data: {
        userId,
        name,
        systemPrompt,
        tools:
          toolIds && toolIds.length
            ? {
                create: toolIds.map((integrationActionId) => ({
                  integrationActionId,
                })),
              }
            : undefined,
      },
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
    });

    return {
      id: agent.id,
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      tools: agent.tools.map((tool) => ({
        id: tool.integrationAction.id,
        actionName:
          tool.integrationAction.actionName ?? tool.integrationAction.actionKey,
        description: tool.integrationAction.description ?? null,
        integrationName:
          tool.integrationAction.integration.displayName ??
          tool.integrationAction.integration.provider,
      })),
    };
  }

  private async ensureAgentOwnership(agentId: number, userId: number) {
    const agent = await this.prisma.client.agent.findUnique({
      where: { id: agentId },
      select: { id: true, userId: true },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found.');
    }

    if (agent.userId !== userId) {
      throw new ForbiddenException('You do not have access to this agent.');
    }
  }

  async updateAgentForUser(params: {
    agentId: number;
    userId: number;
    name?: string;
    systemPrompt?: string;
    toolIds?: number[];
  }) {
    const { agentId, userId, name, systemPrompt, toolIds } = params;

    await this.ensureAgentOwnership(agentId, userId);

    if (toolIds) {
      // Reconcile tools: remove unselected, add new
      const existingTools = await this.prisma.client.agentTool.findMany({
        where: { agentId },
      });

      const existingIds = new Set(
        existingTools.map((tool) => tool.integrationActionId),
      );
      const incomingIds = new Set(toolIds);

      const toDelete = existingTools
        .filter((tool) => !incomingIds.has(tool.integrationActionId))
        .map((tool) => tool.id);

      const toCreate = toolIds.filter((id) => !existingIds.has(id));

      await this.prisma.client.$transaction([
        toDelete.length
          ? this.prisma.client.agentTool.deleteMany({
              where: {
                id: {
                  in: toDelete,
                },
              },
            })
          : this.prisma.client.agentTool.deleteMany({
              where: { id: { in: [] } },
            }),
        toCreate.length
          ? this.prisma.client.agentTool.createMany({
              data: toCreate.map((integrationActionId) => ({
                agentId,
                integrationActionId,
              })),
            })
          : this.prisma.client.agentTool.createMany({
              data: [],
            }),
      ]);
    }

    const agent = await this.prisma.client.agent.update({
      where: { id: agentId },
      data: {
        name,
        systemPrompt,
      },
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
    });

    return {
      id: agent.id,
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      tools: agent.tools.map((tool) => ({
        id: tool.integrationAction.id,
        actionName:
          tool.integrationAction.actionName ?? tool.integrationAction.actionKey,
        description: tool.integrationAction.description ?? null,
        integrationName:
          tool.integrationAction.integration.displayName ??
          tool.integrationAction.integration.provider,
      })),
    };
  }

  async deleteAgentForUser(params: { agentId: number; userId: number }) {
    const { agentId, userId } = params;

    await this.ensureAgentOwnership(agentId, userId);

    await this.prisma.client.$transaction([
      // Detach the agent from all conversations so future messages
      // no longer consider this agent or its tools.
      this.prisma.client.conversationAgent.deleteMany({
        where: { agentId },
      }),
      // Remove all tools associated with this agent.
      this.prisma.client.agentTool.deleteMany({
        where: { agentId },
      }),
      // Finally, delete the agent record itself.
      this.prisma.client.agent.delete({
        where: { id: agentId },
      }),
    ]);

    return { success: true };
  }
}
