<script setup lang="ts">
interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  type?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  label: undefined,
  placeholder: undefined,
  hint: undefined,
  error: undefined,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <label class="block text-sm text-text-secondary">
    <span v-if="label" class="mb-1 block font-medium text-text-primary">
      {{ label }}
    </span>
    <div
      class="flex items-center rounded-md border bg-bg-surface px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
      :class="[
        error ? 'border-danger focus-within:ring-danger/20' : 'border-border-subtle',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
      ]"
    >
      <input
        :type="type"
        class="w-full border-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-subtle"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        @input="onInput"
      />
    </div>
    <p v-if="hint && !error" class="mt-1 text-xs text-text-muted">
      {{ hint }}
    </p>
    <p v-if="error" class="mt-1 text-xs text-danger">
      {{ error }}
    </p>
  </label>
</template>

