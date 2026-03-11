const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface SigninPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiErrorShape {
  message?: string | string[];
}

export interface IntegrationListItem {
  id: number;
  uniqueKey: string;
  name: string | null;
  provider: string;
  logoUrl: string | null;
  actionsEnabled: number;
  agentsUsingCount: number;
  status: 'connected' | 'disconnected';
  connectionId: string | null;
}

export interface AgentToolOption {
  id: number;
  actionName: string;
  description: string | null;
  integrationName: string;
}

export interface AgentListItem {
  id: number;
  name: string;
  systemPrompt: string;
  tools: AgentToolOption[];
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = (isJson ? await response.json() : null) as
    | T
    | ApiErrorShape
    | null;

  if (!response.ok) {
    const apiError = (data ?? {}) as ApiErrorShape;
    const rawMessage = apiError.message;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage) && rawMessage.length > 0
        ? rawMessage[0]
        : 'Something went wrong. Please try again.';

    throw new Error(message);
  }

  return data as T;
}

export async function signup(payload: SignupPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<unknown>(response);
}

export async function signin(payload: SigninPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<{ user: User }>(response);
}

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleJsonResponse<{ user: User }>(response);
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return handleJsonResponse<{ success: boolean }>(response);
}

export async function getIntegrations(options?: { force?: boolean }) {
  const url = new URL(`${API_BASE_URL}/integrations`);

  if (options?.force) {
    url.searchParams.set('force', '1');
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  return handleJsonResponse<{ integrations: IntegrationListItem[] }>(response);
}

export async function createIntegrationConnectSession(integrationId: number) {
  const response = await fetch(
    `${API_BASE_URL}/integrations/${integrationId}/connect-session`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  return handleJsonResponse<{ session: { token: string; connect_link?: string } }>(
    response,
  );
}

export async function disconnectIntegration(
  integrationId: number,
  connectionId: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/integrations/${integrationId}/connections/${encodeURIComponent(
      connectionId,
    )}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  return handleJsonResponse<{ success: boolean }>(response);
}

export async function getAgents() {
  const response = await fetch(`${API_BASE_URL}/agents`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleJsonResponse<{ agents: AgentListItem[] }>(response);
}

export async function getAgentTools() {
  const response = await fetch(`${API_BASE_URL}/agents/tools`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleJsonResponse<{ tools: AgentToolOption[] }>(response);
}

interface SaveAgentPayload {
  name: string;
  systemPrompt: string;
  toolIds?: number[];
}

export async function createAgent(payload: SaveAgentPayload) {
  const response = await fetch(`${API_BASE_URL}/agents`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<{ agent: AgentListItem }>(response);
}

export async function updateAgent(id: number, payload: SaveAgentPayload) {
  const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse<{ agent: AgentListItem }>(response);
}

export async function deleteAgent(id: number) {
  const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return handleJsonResponse<{ success: boolean }>(response);
}

// Chats / conversations

export interface ConversationListItem {
  id: string;
  updatedAt: string;
  title: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolExecutionId?: number;
  createdAt: string;
  toolExecution?: {
    id: number;
    toolName: string;
    inputJson: unknown;
    outputJson: unknown;
  };
}

export interface ConversationWithMessages {
  id: string;
  agentIds: number[];
  updatedAt: string;
  agents?: { id: number; name: string }[];
  messages: ChatMessage[];
}

export type ChatStreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; id: string; name: string; args: Record<string, unknown> }
  | {
      type: 'tool_result';
      id: string;
      name: string;
      input: unknown;
      output: unknown;
    }
  | { type: 'done' };

export async function getConversations() {
  const response = await fetch(`${API_BASE_URL}/chats/conversations`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleJsonResponse<{ conversations: ConversationListItem[] }>(response);
}

export async function getConversation(id: string) {
  const response = await fetch(`${API_BASE_URL}/chats/conversations/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleJsonResponse<ConversationWithMessages>(response);
}

export interface ConversationAgents {
  agentIds: number[];
  agents: { id: number; name: string }[];
}

export async function getConversationAgents(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/chats/conversations/${id}/agents`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );
  return handleJsonResponse<ConversationAgents>(response);
}

export async function updateConversationAgents(
  id: string,
  agentIds: number[],
) {
  const response = await fetch(
    `${API_BASE_URL}/chats/conversations/${id}/agents`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentIds }),
    },
  );
  return handleJsonResponse<ConversationAgents>(response);
}

export async function createConversation() {
  const response = await fetch(`${API_BASE_URL}/chats/conversations`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleJsonResponse<{ id: string }>(response);
}

export async function deleteConversation(id: string) {
  const response = await fetch(`${API_BASE_URL}/chats/conversations/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleJsonResponse<{ success: boolean }>(response);
}

export async function sendMessageStream(
  conversationId: string,
  content: string,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/chats/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : null;
    const msg =
      data?.message ?? (Array.isArray(data?.message) ? data.message[0] : null) ?? response.statusText;
    throw new Error(typeof msg === 'string' ? msg : 'Failed to send message');
  }

  if (!response.body) throw new Error('No response body');
  const stream = response.body.pipeThrough(new TextDecoderStream());
  const readStream = stream.getReader();
  let buffer = '';

  while (true) {
    const { done, value } = await readStream.read();
    if (done) break;
    buffer += value ?? '';
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed) as ChatStreamEvent;
        onEvent(event);
      } catch {
        // skip malformed line
      }
    }
  }

  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer.trim()) as ChatStreamEvent;
      onEvent(event);
    } catch {
      // skip
    }
  }
}


