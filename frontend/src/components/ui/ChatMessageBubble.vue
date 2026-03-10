<script setup lang="ts">
import { computed } from 'vue';

type ChatRole = 'user' | 'assistant' | 'system' | 'agent';
type ChatStatus = 'default' | 'error' | 'streaming';

interface Props {
  role?: ChatRole;
  status?: ChatStatus;
  timestamp?: string;
  showAvatar?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  role: 'assistant',
  status: 'default',
  timestamp: undefined,
  showAvatar: false,
});

const wrapperClasses = computed(() => {
  if (props.role === 'user') {
    return 'flex justify-end';
  }
  return 'flex justify-start';
});

const bubbleClasses = computed(() => {
  const base =
    'max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-card border border-border-subtle';

  if (props.role === 'user') {
    return `${base} bg-primary text-text-on-primary rounded-br-sm`;
  }

  if (props.role === 'system') {
    return `${base} bg-bg-surface-subtle text-text-secondary rounded-l-md`;
  }

  if (props.status === 'error') {
    return `${base} bg-danger-soft text-danger border-danger/40`;
  }

  return `${base} bg-bg-surface text-text-primary`;
});
</script>

<template>
  <div :class="wrapperClasses">
    <div class="flex max-w-full items-end gap-3">
      <div v-if="showAvatar && role !== 'user'" class="h-8 w-8 rounded-full bg-primary/10" />
      <div>
        <div :class="bubbleClasses">
          <slot />
        </div>
        <p v-if="timestamp" class="mt-1 text-xs text-text-subtle">
          {{ timestamp }}
        </p>
      </div>
      <div v-if="showAvatar && role === 'user'" class="h-8 w-8 rounded-full bg-slate-400" />
    </div>
  </div>
</template>

