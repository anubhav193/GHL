<script setup lang="ts">
import { computed } from 'vue';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

const props = defineProps<{
  toasts: Toast[];
}>();

const hasToasts = computed(() => props.toasts.length > 0);
</script>

<template>
  <div
    v-if="hasToasts"
    class="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-xs flex-col gap-2"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="rounded-md bg-surface-elevated px-3 py-2 text-xs text-text-primary shadow-card border border-border-subtle"
      :class="[
        toast.variant === 'success' && 'border-green-200',
        toast.variant === 'warning' && 'border-yellow-200',
        toast.variant === 'danger' && 'border-red-200',
      ]"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

