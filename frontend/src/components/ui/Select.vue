<script setup lang="ts">
interface Option {
  label: string;
  value: string | number;
}

interface Props {
  modelValue: string | number | null;
  label?: string;
  placeholder?: string;
  options: Option[];
  hint?: string;
  error?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  placeholder: undefined,
  hint: undefined,
  error: undefined,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
}>();

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value === '' ? null : target.value);
};
</script>

<template>
  <label class="block text-sm text-text-secondary">
    <span v-if="label" class="mb-1 block font-medium text-text-primary">
      {{ label }}
    </span>
    <div
      class="rounded-md border bg-bg-surface shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
      :class="[
        error ? 'border-danger focus-within:ring-danger/20' : 'border-border-subtle',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
      ]"
    >
      <select
        class="block w-full rounded-md border-none bg-transparent px-3 py-2 text-sm text-text-primary outline-none"
        :value="modelValue ?? ''"
        :disabled="disabled"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled>
          {{ placeholder }}
        </option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <p v-if="hint && !error" class="mt-1 text-xs text-text-muted">
      {{ hint }}
    </p>
    <p v-if="error" class="mt-1 text-xs text-danger">
      {{ error }}
    </p>
  </label>
</template>

