<script setup lang="ts">
interface Props {
  modelValue: boolean;
  label?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  label: undefined,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const onToggle = () => {
  if (props.disabled) return;
  emit('update:modelValue', !props.modelValue);
};
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-2 text-sm text-text-secondary"
    :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
    @click="onToggle"
  >
    <span
      class="relative inline-flex h-5 w-9 items-center rounded-full border border-border-subtle bg-bg-surface-subtle transition-colors data-[checked=true]:border-primary data-[checked=true]:bg-primary"
      :data-checked="modelValue"
    >
      <span
        class="absolute left-0.5 h-4 w-4 rounded-full bg-bg-surface shadow-card transition-transform"
        :class="modelValue ? 'translate-x-4' : 'translate-x-0'"
      />
    </span>
    <span v-if="label">
      {{ label }}
    </span>
  </button>
</template>

