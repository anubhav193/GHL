<script setup lang="ts">
import { computed } from 'vue';

type ChatRole = 'user' | 'assistant' | 'system' | 'agent' | 'tool';
type ChatStatus = 'default' | 'error' | 'streaming';

interface Props {
  role?: ChatRole;
  status?: ChatStatus;
  timestamp?: string;
}

const props = withDefaults(defineProps<Props>(), {
  role: 'assistant',
  status: 'default',
  timestamp: undefined,
});

const wrapperClasses = computed(() => {
  if (props.role === 'user') {
    return 'flex justify-end';
  }
  return 'flex justify-start';
});

const bubbleClasses = computed(() => {
  const base = 'text-sm leading-[1.5] max-w-full';

  if (props.role === 'user') {
    return `${base} py-3 rounded-2xl px-4 bg-primary text-text-on-primary rounded-br-sm`;
  }

  if (props.role === 'system') {
    return `${base} py-3 text-text-secondary rounded-l-md`;
  }

  if (props.role === 'tool') {
    return `${base} px-4 p-2 m-[-10px] text-text-secondary font-mono text-xs`;
  }

  if (props.status === 'error') {
    return `${base} bg-danger-soft text-danger border-danger/40`;
  }

  return `${base} py-3 text-text-primary`;
});
</script>

<template>
  <div :class="wrapperClasses">
    <div
      class="flex-1 items-end gap-3"
      :class="role === 'user' ? 'max-w-[80%] flex justify-end' : 'max-w-full'"
    >
      <div>
        <div :class="bubbleClasses">
          <slot />
        </div>
        <p v-if="timestamp" class="mt-1 text-xs text-text-subtle">
          {{ timestamp }}
        </p>
      </div>
    </div>
  </div>
</template>

