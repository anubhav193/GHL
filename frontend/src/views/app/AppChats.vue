<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';
import { useRoute, useRouter } from 'vue-router';
import ChatInputBar from '@/components/ui/ChatInputBar.vue';
import ChatMessageBubble from '@/components/ui/ChatMessageBubble.vue';
import Button from '@/components/ui/Button.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import Spinner from '@/components/ui/Spinner.vue';
import {
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  sendMessageStream,
  type ConversationListItem,
  type AgentListItem,
  type ChatMessage,
  type ChatStreamEvent,
  getAgents,
  updateConversationAgents,
} from '@/api/client';

const route = useRoute();
const router = useRouter();

const conversationId = computed(() => {
  const id = route.params.conversationId;
  if (id === undefined || id === '') return null;
  return typeof id === 'string' ? id : null;
});

const conversations = ref<ConversationListItem[]>([]);
const messages = ref<ChatMessage[]>([]);
const inputText = ref('');
const loading = ref(false);
const streaming = ref(false);
const error = ref<string | null>(null);
const deleteConfirmId = ref<string | null>(null);
const isDeleting = ref(false);

const displayMessages = ref<
  {
    id?: number;
    role: 'user' | 'assistant' | 'tool';
    content: string;
    status?: 'default' | 'streaming';
    toolExecutionId?: number;
    toolDetails?: { name: string; input: unknown; output: unknown; expanded: boolean };
  }[]
>([]);

const allAgents = ref<AgentListItem[]>([]);
const selectedAgentIds = ref<number[]>([]);
const isAgentPickerOpen = ref(false);
const draftSelectedAgentIds = ref<number[]>([]);
const agentsLoading = ref(false);
const agentsError = ref<string | null>(null);
const savingConversationAgents = ref(false);

const scrollContainerRef = ref<HTMLDivElement | null>(null);
const shouldAutoScroll = ref(true);
// Tracks whether we've already shown any assistant text for the current turn.
const hadAssistantTextThisTurn = ref(false);
// Tracks whether we've started the \"post-tool\" assistant reply for this turn.
const hasPostToolAssistantThisTurn = ref(false);

marked.setOptions({
  breaks: true,
});

function renderMarkdown(text: string): string {
  return marked.parse(text ?? '') as string;
}

function syncDisplayFromMessages() {
  displayMessages.value = messages.value.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    status: 'default' as const,
    toolExecutionId: m.toolExecutionId,
    toolDetails:
      m.role === 'tool' && m.toolExecution
        ? {
            name: m.toolExecution.toolName,
            input: m.toolExecution.inputJson,
            output: m.toolExecution.outputJson,
            expanded: false,
          }
        : undefined,
  }));
}

async function loadConversations() {
  try {
    const { conversations: list } = await getConversations();
    conversations.value = list;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load conversations';
  }
}

async function loadConversation(id: string) {
  // If a stream is in progress and we already have optimistic UI in
  // displayMessages, avoid flashing a loading state or overwriting it with
  // a stale snapshot from the server.
  if (streaming.value && displayMessages.value.length > 0) {
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    const conv = await getConversation(id);
    selectedAgentIds.value = conv.agentIds ?? [];
    messages.value = conv.messages;
    syncDisplayFromMessages();
    // When loading a conversation, reset auto-scroll to bottom.
    shouldAutoScroll.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load conversation';
    messages.value = [];
    displayMessages.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  conversationId,
  (id) => {
    if (id != null) {
      loadConversation(id);
    } else {
      messages.value = [];
      displayMessages.value = [];
      selectedAgentIds.value = [];
    }
  },
  { immediate: true },
);

watch(
  () => route.path,
  () => {
    loadConversations();
  },
  { immediate: true },
);

watch(
  displayMessages,
  () => {
    if (!shouldAutoScroll.value) return;
    const el = scrollContainerRef.value;
    if (!el) return;
    // Scroll to bottom on next frame so DOM has updated.
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  },
  { deep: true },
);

async function handleSubmit() {
  const content = inputText.value.trim();
  if (!content || streaming.value) return;

  let currentId = conversationId.value;

  if (currentId == null) {
    try {
      const { id } = await createConversation();
      currentId = id;

      if (selectedAgentIds.value.length > 0) {
        try {
          await updateConversationAgents(id, selectedAgentIds.value);
        } catch (e) {
          const message =
            e instanceof Error ? e.message : 'Failed to update conversation agents';
          error.value = message;
        }
      }

      await loadConversations();
      router.replace({ name: 'app-chats', params: { conversationId: id } });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create conversation';
      return;
    }
  }

  inputText.value = '';
  hadAssistantTextThisTurn.value = false;
  hasPostToolAssistantThisTurn.value = false;
  displayMessages.value = [
    ...displayMessages.value,
    { role: 'user' as const, content, status: 'default' },
    { role: 'assistant' as const, content: '', status: 'streaming' as const },
  ];

  streaming.value = true;
  error.value = null;

  try {
    await sendMessageStream(currentId, content, (event: ChatStreamEvent) => {
      if (event.type === 'text') {
        // Append streamed text to the most recent assistant message. If we've
        // already started a post-tool assistant reply, always target that.
        for (let i = displayMessages.value.length - 1; i >= 0; i--) {
          const m = displayMessages.value[i];
          if (m && m.role === 'assistant') {
            m.content += event.delta;
            m.status = 'streaming';
            displayMessages.value = [...displayMessages.value];
            hadAssistantTextThisTurn.value = true;
            break;
          }
        }
      } else if (event.type === 'tool_call') {
        const label = `Calling ${event.name}…`;
        const last = displayMessages.value[displayMessages.value.length - 1];
        // Avoid duplicating the same tool card if multiple identical events arrive.
        if (last && last.role === 'tool' && last.content === label) return;
        // Always append the tool card *after* the assistant message so the
        // acknowledgement text stays visually first.
        displayMessages.value = [
          ...displayMessages.value,
          {
            role: 'tool' as const,
            content: label,
            status: 'default' as const,
          },
        ];
      } else if (event.type === 'tool_result') {
        let idx = -1;
        for (let i = displayMessages.value.length - 1; i >= 0; i--) {
          const m = displayMessages.value[i];
          if (m && m.role === 'tool' && m.content.startsWith('Calling')) {
            idx = i;
            break;
          }
        }
        if (idx >= 0) {
          const details = {
            name: event.name,
            input: event.input,
            output: event.output,
            expanded: false,
          };
          displayMessages.value = displayMessages.value.map((m, i) => {
            if (i !== idx) return m;
            return {
              ...m,
              content: `View result from ${event.name}`,
              toolDetails: details,
            };
          });
          // After we have a tool result, start a fresh assistant message
          // for the final answer so that the acknowledgement stays separate.
          displayMessages.value = [
            ...displayMessages.value,
            {
              role: 'assistant' as const,
              content: '',
              status: 'streaming' as const,
            },
          ];
          hasPostToolAssistantThisTurn.value = true;
        }
      } else if (event.type === 'done') {
        const last = displayMessages.value[displayMessages.value.length - 1];
        if (last && last.role === 'assistant') {
          last.status = 'default';
          displayMessages.value = [...displayMessages.value];
        }
        loadConversation(currentId!);
        loadConversations();
      }
    });
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to send message';
    const last = displayMessages.value[displayMessages.value.length - 1];
    if (last && last.role === 'assistant') {
      last.content = last.content || 'Something went wrong.';
      last.status = 'default';
      displayMessages.value = [...displayMessages.value];
    }
  } finally {
    streaming.value = false;
  }
}

function openDeleteConfirm(id: string) {
  deleteConfirmId.value = id;
}

function closeDeleteConfirm() {
  if (!isDeleting.value) deleteConfirmId.value = null;
}

async function confirmDeleteConversation() {
  const id = deleteConfirmId.value;
  if (!id) return;
  const wasViewingDeleted = conversationId.value === id;
  const deletedIndex = conversations.value.findIndex((c) => c.id === id);
  isDeleting.value = true;
  try {
    await deleteConversation(id);
    deleteConfirmId.value = null;
    await loadConversations();
    if (wasViewingDeleted) {
      const listAfter = conversations.value;
      const nextConversation = listAfter[deletedIndex] ?? listAfter[0];
      if (nextConversation) {
        router.push({ name: 'app-chats', params: { conversationId: nextConversation.id } });
      } else {
        router.push({ name: 'app-chats' });
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete conversation';
  } finally {
    isDeleting.value = false;
  }
}

async function ensureAgentsLoaded() {
  if (allAgents.value.length || agentsLoading.value) return;

  try {
    agentsLoading.value = true;
    agentsError.value = null;
    const { agents } = await getAgents();
    allAgents.value = agents;
  } catch (e) {
    agentsError.value =
      e instanceof Error ? e.message : 'Failed to load agents. Please try again.';
  } finally {
    agentsLoading.value = false;
  }
}

function openAgentPicker() {
  agentsError.value = null;
  draftSelectedAgentIds.value = [...selectedAgentIds.value];
  isAgentPickerOpen.value = true;
  void ensureAgentsLoaded();
}

function handleNewChatClick() {
  router.push({ name: 'app-chats' });
  selectedAgentIds.value = [];
  draftSelectedAgentIds.value = [];
  openAgentPicker();
}

function closeAgentPicker() {
  if (savingConversationAgents.value) return;
  isAgentPickerOpen.value = false;
}

function toggleDraftAgent(agentId: number) {
  if (draftSelectedAgentIds.value.includes(agentId)) {
    draftSelectedAgentIds.value = draftSelectedAgentIds.value.filter((id) => id !== agentId);
  } else {
    draftSelectedAgentIds.value = [...draftSelectedAgentIds.value, agentId];
  }
}

async function saveConversationAgents() {
  if (!conversationId.value) {
    selectedAgentIds.value = [...draftSelectedAgentIds.value];
    isAgentPickerOpen.value = false;
    return;
  }

  try {
    savingConversationAgents.value = true;
    agentsError.value = null;
    const { agentIds } = await updateConversationAgents(
      conversationId.value,
      draftSelectedAgentIds.value,
    );
    selectedAgentIds.value = agentIds;
    isAgentPickerOpen.value = false;
  } catch (e) {
    agentsError.value =
      e instanceof Error ? e.message : 'Failed to update conversation agents.';
  } finally {
    savingConversationAgents.value = false;
  }
}

</script>

<template>
  <div class="flex flex-1 min-h-0 w-full overflow-hidden">
    <aside
      class="flex w-[300px] shrink-0 flex-col min-h-0 border-r border-border-subtle bg-bg-surface p-2"
    >
      <div class="relative flex-1 min-h-0">
        <div class="absolute inset-0 overflow-y-auto p-2">
          <RouterLink
            :to="{ name: 'app-chats' }"
            class="block rounded-lg border border-border-subtle bg-bg-surface-subtle px-2 py-2 text-center text-xs font-medium text-text-primary hover:bg-bg-surface-subtle"
            @click.prevent="handleNewChatClick"
          >
            New chat
          </RouterLink>
          <ul class="mt-2 flex flex-col gap-1">
            <li
              v-for="c in conversations"
              :key="c.id"
              class="group flex items-center gap-0.5 rounded px-1 py-0.5"
              :class="
                conversationId === c.id
                  ? 'bg-primary/10'
                  : 'hover:bg-bg-surface-subtle'
              "
            >
              <RouterLink
                :to="{ name: 'app-chats', params: { conversationId: c.id } }"
                class="min-w-0 flex-1 truncate rounded px-2 py-1.5 text-left text-xs text-text-secondary hover:text-text-primary"
                :class="
                  conversationId === c.id
                    ? 'text-primary font-medium'
                    : ''
                "
              >
                {{ c.title }}
              </RouterLink>
              <button
                type="button"
                class="flex shrink-0 items-center justify-center rounded p-1 text-text-subtle opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                aria-label="Delete conversation"
                @click.prevent.stop="openDeleteConfirm(c.id)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>

    <div class="flex flex-1 flex-col min-w-0">
      <div class="relative flex flex-1 min-w-0">
        <div
          ref="scrollContainerRef"
          class="absolute inset-0 overflow-y-auto"
          @scroll="
            (event) => {
              const el = event.target as HTMLDivElement;
              const threshold = 48;
              const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
              shouldAutoScroll = distanceFromBottom <= threshold;
            }
          "
        >
          <div
            class="flex min-h-full flex-col mx-auto"
            style="max-width: min(100%, 800px); width: 100%;"
          >
            <div
              class="flex-1 flex flex-col px-4 pt-4"
              style="min-height: 0;"
            >
              <div
                v-if="loading && messages.length === 0"
                class="flex justify-center py-8 text-sm text-text-muted"
              >
                Loading…
              </div>
              <div
                v-else-if="error && messages.length === 0"
                class="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"
              >
                {{ error }}
              </div>
              <div v-else class="flex flex-col gap-3 flex-1">
                <template
                  v-for="(msg, i) in displayMessages"
                  :key="msg.id ?? `tmp-${i}`"
                >
                  <ChatMessageBubble
                    :role="msg.role"
                    :status="msg.status ?? 'default'"
                  >
                    <template v-if="msg.role === 'tool' && msg.toolDetails">
                      <button
                        type="button"
                        class="flex w-full flex-col text-left"
                        @click="
                          () => {
                            msg.toolDetails!.expanded = !msg.toolDetails!.expanded;
                          }
                        "
                      >
                        <span class="whitespace-pre-wrap font-medium">
                          {{ msg.content }}
                        </span>
                        <div
                          v-if="msg.toolDetails.expanded"
                          class="mt-2 space-y-2 text-xs"
                        >
                          <div>
                            <p class="font-semibold text-text-secondary">Input</p>
                            <pre class="mt-1 max-h-40 overflow-auto rounded bg-bg-surface-subtle p-2">
{{ JSON.stringify(msg.toolDetails.input, null, 2) }}
                            </pre>
                          </div>
                          <div>
                            <p class="font-semibold text-text-secondary">Output</p>
                            <pre class="mt-1 max-h-40 overflow-auto rounded bg-bg-surface-subtle p-2">
{{ JSON.stringify(msg.toolDetails.output, null, 2) }}
                            </pre>
                          </div>
                        </div>
                      </button>
                    </template>
                    <template v-else>
                      <div
                        class="prose prose-sm max-w-none"
                        v-html="renderMarkdown(msg.content)"
                      />
                    </template>
                  </ChatMessageBubble>
                </template>

                <div class="flex-1" />

                <div
                  class="sticky bottom-0 -mx-4 px-4 pt-3 pb-3"
                >
                  <button
                    type="button"
                    class="mb-1 flex cursor-pointer items-center gap-1 text-[11px]"
                    :class="
                      selectedAgentIds.length > 0
                        ? 'text-emerald-600'
                        : 'text-text-muted hover:text-text-secondary'
                    "
                    @click="openAgentPicker"
                  >
                    <span
                      class="inline-block h-2 w-2 rounded-full"
                      :class="
                        selectedAgentIds.length > 0
                          ? 'bg-emerald-500'
                          : 'bg-border-subtle'
                      "
                    />
                    <span class="underline-offset-2 hover:underline">
                      {{ selectedAgentIds.length }}
                      {{ selectedAgentIds.length === 1 ? 'agent active' : 'agents active' }}
                    </span>
                  </button>
                  <div
                    v-if="error && displayMessages.length > 0"
                    class="mb-2 text-xs text-danger"
                  >
                    {{ error }}
                  </div>
                  <ChatInputBar
                    v-model="inputText"
                    placeholder="Type a message..."
                    :disabled="streaming"
                    @submit="handleSubmit"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="isAgentPickerOpen"
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="conversation-agents-title"
    @click="closeAgentPicker"
  >
    <div
      class="w-full max-w-[420px] rounded-lg border border-border-subtle bg-bg-surface p-5 shadow-xl"
      @click.stop
    >
      <header class="mb-4">
        <h2
          id="conversation-agents-title"
          class="text-base font-semibold text-text-primary"
        >
          Choose agents for this chat
        </h2>
        <p class="mt-1 text-xs text-text-muted">
          Agents are optional. If none are selected, this chat will not use any tools.
        </p>
      </header>

      <div class="space-y-3">
        <p v-if="agentsError" class="text-xs text-danger">
          {{ agentsError }}
        </p>

        <div
          v-if="agentsLoading"
          class="flex items-center gap-2 py-2 text-xs text-text-muted"
        >
          <Spinner :size="16" />
          <span>Loading agents...</span>
        </div>

        <p
          v-else-if="!allAgents.length"
          class="py-2 text-xs text-text-muted"
        >
          No agents available yet. Create agents first from the Agents page.
        </p>

        <ul
          v-else
          class="max-h-56 space-y-2 overflow-y-auto rounded-md border border-border-subtle bg-bg-surface-subtle p-2"
        >
          <li
            v-for="agent in allAgents"
            :key="agent.id"
            class="m-0 flex cursor-pointer items-start gap-2 rounded px-1 py-1 hover:bg-bg-surface"
            @click="toggleDraftAgent(agent.id)"
          >
            <Checkbox
              :model-value="draftSelectedAgentIds.includes(agent.id)"
              class="mt-0.5"
              @update:model-value.stop="() => toggleDraftAgent(agent.id)"
            />
            <div class="space-y-0.5">
              <p class="text-xs font-medium text-text-primary">
                {{ agent.name }}
              </p>
              <p class="line-clamp-1 text-[11px] text-text-muted">
                {{ agent.systemPrompt }}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <footer class="mt-5 flex justify-end gap-2">
        <Button
          size="sm"
          variant="subtle"
          :disabled="savingConversationAgents"
          @click="closeAgentPicker"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          :loading="savingConversationAgents"
          :disabled="savingConversationAgents"
          @click="saveConversationAgents"
        >
          Save
        </Button>
      </footer>
    </div>
  </div>

  <div
    v-if="deleteConfirmId !== null"
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-conversation-title"
    @click="closeDeleteConfirm"
  >
    <div
      class="w-full max-w-[380px] rounded-lg border border-border-subtle bg-bg-surface p-5 shadow-xl"
      @click.stop
    >
      <h2 id="delete-conversation-title" class="text-base font-semibold text-text-primary">
        Delete conversation?
      </h2>
      <p class="mt-2 text-sm text-text-muted">
        This cannot be undone.
      </p>
      <footer class="mt-5 flex justify-end gap-2">
        <Button
          size="sm"
          variant="subtle"
          :disabled="isDeleting"
          @click="closeDeleteConfirm"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="danger"
          :loading="isDeleting"
          :disabled="isDeleting"
          @click="confirmDeleteConversation"
        >
          Delete
        </Button>
      </footer>
    </div>
  </div>
</template>
