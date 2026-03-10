<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Textarea from '@/components/ui/Textarea.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import Spinner from '@/components/ui/Spinner.vue';
import type { AgentListItem, AgentToolOption } from '@/api/client';
import {
  createAgent,
  deleteAgent,
  getAgentTools,
  getAgents,
  updateAgent,
} from '@/api/client';
import { useToast } from '@/composables/useToast';

type ModalMode = 'create' | 'edit';

const agents = ref<AgentListItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const isModalOpen = ref(false);
const modalMode = ref<ModalMode>('create');
const selectedAgentId = ref<number | null>(null);

const agentName = ref('');
const agentSystemPrompt = ref('');
const availableTools = ref<AgentToolOption[]>([]);
const selectedToolIds = ref<number[]>([]);

const isSaving = ref(false);
const isDeleting = ref(false);
const toolsLoading = ref(false);

const { showToast } = useToast();

const isFormValid = computed(
  () =>
    agentName.value.trim().length > 0 &&
    agentSystemPrompt.value.trim().length > 0,
);

async function loadAgents() {
  try {
    isLoading.value = true;
    error.value = null;

    const { agents: items } = await getAgents();
    agents.value = items;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to load agents.';
  } finally {
    isLoading.value = false;
  }
}

async function ensureToolsLoaded() {
  if (availableTools.value.length || toolsLoading.value) return;

  try {
    toolsLoading.value = true;
    const { tools } = await getAgentTools();
    availableTools.value = tools;
  } catch (err) {
    showToast(
      err instanceof Error ? err.message : 'Failed to load tools.',
      'danger',
    );
  } finally {
    toolsLoading.value = false;
  }
}

function openCreateModal() {
  modalMode.value = 'create';
  selectedAgentId.value = null;
  agentName.value = '';
  agentSystemPrompt.value = '';
  selectedToolIds.value = [];
  isModalOpen.value = true;
  void ensureToolsLoaded();
}

function openEditModal(agent: AgentListItem) {
  modalMode.value = 'edit';
  selectedAgentId.value = agent.id;
  agentName.value = agent.name;
  agentSystemPrompt.value = agent.systemPrompt;
  selectedToolIds.value = agent.tools.map((tool) => tool.id);
  isModalOpen.value = true;
  void ensureToolsLoaded();
}

function closeModal() {
  if (isSaving.value || isDeleting.value) return;
  isModalOpen.value = false;
}

function toggleToolSelection(toolId: number) {
  if (selectedToolIds.value.includes(toolId)) {
    selectedToolIds.value = selectedToolIds.value.filter((id) => id !== toolId);
  } else {
    selectedToolIds.value = [...selectedToolIds.value, toolId];
  }
}

async function handleSave() {
  if (!isFormValid.value || isSaving.value) return;

  try {
    isSaving.value = true;
    const payload = {
      name: agentName.value.trim(),
      systemPrompt: agentSystemPrompt.value.trim(),
      toolIds: selectedToolIds.value,
    };

    if (modalMode.value === 'create') {
      await createAgent(payload);
      showToast('Agent created.', 'success');
    } else if (modalMode.value === 'edit' && selectedAgentId.value != null) {
      await updateAgent(selectedAgentId.value, payload);
      showToast('Agent updated.', 'success');
    }

    isModalOpen.value = false;
    await loadAgents();
  } catch (err) {
    showToast(
      err instanceof Error ? err.message : 'Failed to save agent.',
      'danger',
    );
  } finally {
    isSaving.value = false;
  }
}

async function handleDelete() {
  if (modalMode.value !== 'edit' || selectedAgentId.value == null) return;
  if (isDeleting.value) return;

  try {
    isDeleting.value = true;
    await deleteAgent(selectedAgentId.value);
    showToast('Agent deleted.', 'success');
    isModalOpen.value = false;
    await loadAgents();
  } catch (err) {
    showToast(
      err instanceof Error ? err.message : 'Failed to delete agent.',
      'danger',
    );
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  loadAgents();
});
</script>

<template>
  <section class="space-y-4">
    <header class="space-y-1">
      <p class="text-xs uppercase tracking-wide text-text-subtle">
        App / Agents
      </p>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-text-primary">
            Agents
          </h1>
          <p class="text-xs text-text-muted">
            You will configure, organize, and manage agents from here.
          </p>
        </div>
        <Button size="sm" variant="primary" @click="openCreateModal">
          Create agent
        </Button>
      </div>
    </header>

    <Card>

      <div class="space-y-3">
        <p v-if="error" class="text-xs text-danger">
          {{ error }}
        </p>

        <div
          v-if="isLoading"
          class="flex items-center justify-center py-8"
        >
          <Spinner :size="20" />
        </div>

        <p
          v-else-if="!agents.length"
          class="py-10 text-center text-sm text-text-muted"
        >
          No agents created yet. Create one to get started.
        </p>

        <ul
          v-else
          class="divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface-elevated"
        >
          <li
            v-for="agent in agents"
            :key="agent.id"
            class="flex items-center justify-between gap-4 p-3"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-md bg-surface-sunken text-xs font-semibold text-text-secondary"
              >
                <svg
                  viewBox="0 0 64 64"
                  class="h-[30px] w-[30px] text-text-secondary"
                  aria-hidden="true"
                >
                  <line
                    x1="32"
                    y1="10"
                    x2="32"
                    y2="20"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                  <circle
                    cx="32"
                    cy="8"
                    r="4"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                  />
                  <rect
                    x="14"
                    y="20"
                    width="36"
                    height="30"
                    rx="4"
                    ry="4"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                  />
                  <rect
                    x="8"
                    y="28"
                    width="6"
                    height="14"
                    rx="2"
                    ry="2"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                  />
                  <rect
                    x="50"
                    y="28"
                    width="6"
                    height="14"
                    rx="2"
                    ry="2"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                  />
                  <circle
                    cx="24"
                    cy="35"
                    r="3"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="35"
                    r="3"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                  />
                </svg>
              </div>
              <div class="space-y-0.5">
                <p class="text-sm font-medium text-text-primary">
                  {{ agent.name }}
                </p>
                <p class="line-clamp-1 text-xs text-text-muted">
                  {{ agent.systemPrompt }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <span
                class="rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted"
              >
                {{ agent.tools.length }} tool{{ agent.tools.length === 1 ? '' : 's' }}
              </span>
              <Button size="sm" variant="secondary" @click="openEditModal(agent)">
                Modify
              </Button>
            </div>
          </li>
        </ul>
      </div>
    </Card>

    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
    >
      <div
        class="w-full max-w-[500px] rounded-lg bg-bg-surface p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <header class="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-text-primary">
              {{ modalMode === 'create' ? 'Create agent' : 'Edit agent' }}
            </h2>
            <p class="text-xs text-text-muted">
              Configure the core behavior and tools for this agent.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full p-1 text-text-muted hover:bg-bg-subtle"
            @click="closeModal"
          >
            <span class="sr-only">Close</span>
            <svg viewBox="0 0 20 20" class="h-4 w-4" aria-hidden="true">
              <path
                d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </header>

        <div class="space-y-4">
          <Input
            v-model="agentName"
            label="Agent name"
            placeholder="My pricing assistant"
          />

          <Textarea
            v-model="agentSystemPrompt"
            label="System prompt"
            placeholder="You are an expert assistant that helps with..."
            :rows="5"
          />

          <div class="space-y-2">
            <p class="text-text-primary text-sm font-medium mb-1">
              Tools available to the agent
            </p>

            <div
              v-if="toolsLoading"
              class="flex items-center justify-start py-2"
            >
              <Spinner :size="16" />
            </div>

            <p
              v-else-if="!availableTools.length"
              class="text-xs text-text-muted"
            >
              No connected tools are available yet. Connect integrations first to
              unlock tools.
            </p>

            <div
              v-else
              class="max-h-52 flex flex-col gap-3 overflow-y-auto rounded-md border border-border-subtle bg-bg-subtle p-3"
            >
              <label
                v-for="tool in availableTools"
                :key="tool.id"
                class="flex items-start gap-2 rounded-md m-0 hover:bg-bg-surface"
              >
                <Checkbox
                  :model-value="selectedToolIds.includes(tool.id)"
                  @update:model-value="() => toggleToolSelection(tool.id)"
                />
                <div class="space-y-0.5">
                  <p class="text-xs font-medium text-text-primary">
                    {{ tool.actionName }}
                    <span class="ml-1 text-[11px] font-normal text-text-muted">
                      · {{ tool.integrationName }}
                    </span>
                  </p>
                  <p v-if="tool.description" class="text-[11px] text-text-muted">
                    {{ tool.description }}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <footer class="mt-5 flex items-center justify-between gap-3">
          <Button
            v-if="modalMode === 'edit'"
            size="sm"
            variant="danger"
            :loading="isDeleting"
            :disabled="isSaving || isDeleting"
            @click="handleDelete"
          >
            Delete
          </Button>

          <div class="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="subtle"
              :disabled="isSaving || isDeleting"
              @click="closeModal"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              :loading="isSaving"
              :disabled="!isFormValid || isSaving || isDeleting"
              @click="handleSave"
            >
              {{ modalMode === 'create' ? 'Create agent' : 'Save changes' }}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  </section>
</template>