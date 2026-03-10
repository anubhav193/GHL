<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
});
</script>

<template>
  <header class="mb-4 flex items-baseline justify-between gap-3">
    <div>
      <h2 class="text-sm font-semibold text-text-primary">
        {{ title }}
      </h2>
      <p v-if="subtitle" class="mt-1 text-xs text-text-muted">
        {{ subtitle }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

