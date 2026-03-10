<script setup lang="ts">
interface Props {
  label: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center rounded-full bg-bg-surface-subtle px-3 py-1 text-xs font-medium text-text-secondary shadow-sm transition-colors hover:bg-primary-soft hover:text-primary"
    @click="emit('click')"
  >
    {{ label }}
  </button>
</template>

