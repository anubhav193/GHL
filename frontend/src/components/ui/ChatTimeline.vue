<script setup lang="ts">
interface Props {
  emptyLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  emptyLabel: 'No messages yet',
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-3 rounded-md bg-bg-surface-subtle p-4">
    <slot v-if="$slots.default" />
    <p v-else class="text-center text-xs text-text-muted">
      {{ emptyLabel }}
    </p>
  </div>
</template>

