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

const onToggle = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
};
</script>

<template>
  <label
    class="inline-flex items-center gap-2 text-sm text-text-secondary"
    :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
  >
    <span
      class="relative inline-flex h-4 w-4 items-center justify-center rounded-[4px] border border-border-subtle bg-bg-surface shadow-sm transition-colors data-[checked=true]:border-primary data-[checked=true]:bg-primary"
      :data-checked="modelValue"
    >
      <input
        type="checkbox"
        class="absolute inset-0 h-full w-full cursor-inherit opacity-0"
        :checked="modelValue"
        :disabled="disabled"
        @change="onToggle"
      />
      <svg
        v-if="modelValue"
        class="h-3 w-3 text-text-on-primary"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4 8.5 6.5 11 12 5.5"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span v-if="label">
      {{ label }}
    </span>
  </label>
</template>

