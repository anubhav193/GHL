<script setup lang="ts">
interface Props {
  title: string;
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  description: undefined,
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-surface-subtle px-6 py-10 text-center"
  >
    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
      <slot name="icon">
        <span class="text-primary">◎</span>
      </slot>
    </div>
    <h2 class="text-sm font-semibold text-text-primary">
      {{ title }}
    </h2>
    <p v-if="description" class="mt-2 max-w-md text-xs text-text-muted">
      {{ description }}
    </p>
    <div v-if="$slots.actions" class="mt-4 flex flex-wrap items-center justify-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

