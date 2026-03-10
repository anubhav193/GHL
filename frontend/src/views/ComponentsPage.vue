
<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Textarea from '@/components/ui/Textarea.vue';
import Select from '@/components/ui/Select.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import RadioGroup from '@/components/ui/RadioGroup.vue';
import Radio from '@/components/ui/Radio.vue';
import Switch from '@/components/ui/Switch.vue';
import Slider from '@/components/ui/Slider.vue';
import Card from '@/components/ui/Card.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import Badge from '@/components/ui/Badge.vue';
import Spinner from '@/components/ui/Spinner.vue';
import Alert from '@/components/ui/Alert.vue';
import Tooltip from '@/components/ui/Tooltip.vue';
import ChatMessageBubble from '@/components/ui/ChatMessageBubble.vue';
import ChatTimeline from '@/components/ui/ChatTimeline.vue';
import ChatInputBar from '@/components/ui/ChatInputBar.vue';
import TagChip from '@/components/ui/TagChip.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import AudioTranscriber from '@/components/ui/AudioTranscriber.vue';

const selectOptions = [
  { label: 'Default agent', value: 'default' },
  { label: 'RAG agent', value: 'rag' },
  { label: 'Tool-using agent', value: 'tool' },
];

const streamingResponses = ref(true);
const selectedModel = ref<'gpt-4o' | 'gpt-4o-mini'>('gpt-4o');
const autoSaveAgents = ref(true);
</script>

<template>
  <main class="min-h-screen bg-bg-page">
    <section class="mx-auto max-w-page-content px-8 py-10">
      <header class="mb-8 flex items-baseline justify-between gap-4">
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-text-subtle">
            Design System
          </p>
          <h1 class="mt-1 text-3xl font-semibold text-text-primary">
            Components Gallery
          </h1>
        </div>
      </header>

      <div class="space-y-10">
        <section>
          <SectionHeader
            title="Form controls"
            subtitle="Buttons, inputs, and selectors used across the studio."
          />
          <div class="grid gap-6 md:grid-cols-2">
            <Card>
              <template #header>
                <h3 class="text-sm font-semibold text-text-primary">Buttons</h3>
              </template>
              <div class="space-y-4">
                <div class="flex flex-wrap items-center gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="subtle">Subtle</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="link">Link</Button>
                  <Button
                    variant="link"
                    href="https://example.com"
                    external
                  >
                    External link
                  </Button>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-text-subtle">
                    Loading states
                  </p>
                  <div class="flex flex-wrap items-center gap-3">
                    <Button :loading="true">Primary loading</Button>
                    <Button variant="secondary" :loading="true">
                      Secondary loading
                    </Button>
                    <Button variant="subtle" :loading="true">
                      Subtle loading
                    </Button>
                    <Button variant="danger" :loading="true">
                      Danger loading
                    </Button>
                    <Button variant="link" :loading="true">
                      Link loading
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <template #header>
                <h3 class="text-sm font-semibold text-text-primary">Inputs</h3>
              </template>
              <div class="space-y-3">
                <Input label="Agent name" placeholder="My pricing assistant" model-value="" />
                <Textarea
                  label="System prompt"
                  placeholder="You are an expert pricing agent..."
                  model-value=""
                />
                <Select
                  label="Agent type"
                  placeholder="Select type"
                  :options="selectOptions"
                  :model-value="null"
                />
              </div>
            </Card>

            <Card>
              <template #header>
                <h3 class="text-sm font-semibold text-text-primary">Booleans</h3>
              </template>
              <div class="flex flex-wrap items-center gap-4">
                <Checkbox v-model="streamingResponses" label="Streaming responses" />
                <RadioGroup v-model="selectedModel" name="model">
                  <div class="flex flex-col gap-2">
                    <Radio value="gpt-4o" label="GPT-4.1" />
                    <Radio value="gpt-4o-mini" label="GPT-4.1 mini" />
                  </div>
                </RadioGroup>
                <Switch v-model="autoSaveAgents" label="Auto-save agents" />
              </div>
            </Card>

            <Card>
              <template #header>
                <h3 class="text-sm font-semibold text-text-primary">Slider</h3>
              </template>
              <div class="space-y-2">
                <p class="text-xs text-text-muted">Temperature</p>
                <Slider :model-value="40" :min="0" :max="100" :step="1" />
              </div>
            </Card>
          </div>
        </section>

        <section>
          <SectionHeader
            title="Feedback & status"
            subtitle="Badges, alerts, and loading indicators."
          />
          <div class="grid gap-6 md:grid-cols-2">
            <Card>
              <template #header>
                <h3 class="text-sm font-semibold text-text-primary">Badges & Spinner</h3>
              </template>
              <div class="flex flex-wrap items-center gap-3">
                <Badge>Neutral</Badge>
                <Badge variant="success">Online</Badge>
                <Badge variant="warning">Rate limited</Badge>
                <Badge variant="danger">Error</Badge>
                <Badge variant="info">Beta</Badge>
                <Spinner :size="18" />
              </div>
            </Card>

            <Card>
              <template #header>
                <h3 class="text-sm font-semibold text-text-primary">Alerts</h3>
              </template>
              <div class="space-y-3">
                <Alert title="Indexing in progress">
                  Your documents are being processed. Chat responses may be incomplete until
                  indexing finishes.
                </Alert>
                <Alert variant="warning" title="High usage detected">
                  This workspace is approaching its monthly token limit.
                </Alert>
                <Alert variant="danger" title="Connection lost">
                  We lost connection to the model provider. Retry in a few moments.
                </Alert>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <SectionHeader
            title="Chat primitives"
            subtitle="Building blocks for the conversational interface."
          />
          <div class="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card>
              <template #header>
                <h3 class="text-sm font-semibold text-text-primary">Timeline & bubbles</h3>
              </template>
              <ChatTimeline>
                <ChatMessageBubble
                  role="system"
                  timestamp="System · just now"
                >
                  You are a pricing assistant helping users optimize SaaS plans.
                </ChatMessageBubble>
                <ChatMessageBubble
                  role="user"
                  :show-avatar="true"
                  timestamp="You · 2s ago"
                >
                  Help me design a pricing experiment for my Pro plan.
                </ChatMessageBubble>
                <ChatMessageBubble
                  role="assistant"
                  :show-avatar="true"
                  timestamp="Agent · 1s ago"
                >
                  Great. I can suggest a 3-variant test with guardrails on churn and revenue...
                </ChatMessageBubble>
              </ChatTimeline>
            </Card>

            <div class="space-y-4">
              <Card>
                <template #header>
                  <h3 class="text-sm font-semibold text-text-primary">Chat input bar</h3>
                </template>
                <ChatInputBar model-value="Draft message..." disabled>
                  <template #secondary>
                    <Tooltip text="Insert variable">
                      <Badge>Variables</Badge>
                    </Tooltip>
                  </template>
                </ChatInputBar>
              </Card>

              <Card>
                <template #header>
                  <h3 class="text-sm font-semibold text-text-primary">Quick actions</h3>
                </template>
                <div class="flex flex-wrap gap-2">
                  <TagChip label="Explain this result" />
                  <TagChip label="Suggest follow-up prompts" />
                  <TagChip label="Tune agent tone" />
                </div>
              </Card>

              <Card>
                <template #header>
                  <h3 class="text-sm font-semibold text-text-primary">Audio recorder</h3>
                </template>
                <AudioTranscriber />
              </Card>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            title="Empty states"
            subtitle="Used when no agents, conversations, or data exist yet."
          />
          <EmptyState
            title="No agents created yet"
            description="Create your first agent to start designing conversational workflows and experiments."
          >
            <template #actions>
              <Button>Create agent</Button>
              <Button variant="secondary">Import from template</Button>
            </template>
          </EmptyState>
        </section>
      </div>
    </section>
  </main>
</template>
