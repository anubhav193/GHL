<script setup lang="ts">
interface Props {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type a message...',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
}>();

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    emit('submit');
  }
};
</script>

<template>
  <div
    class="flex items-end gap-3 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 shadow-card"
  >
    <textarea
      class="max-h-32 flex-1 resize-none border-none bg-transparent px-1 py-2 text-sm text-text-primary outline-none placeholder:text-text-subtle"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="modelValue"
      rows="1"
      @input="onInput"
      @keydown="onKeydown"
    />
    <div class="flex items-center gap-1">
      <slot name="secondary" />
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-text-on-primary shadow-card disabled:opacity-60 disabled:pointer-events-none"
        :disabled="disabled || !modelValue"
        @click="emit('submit')"
      >
        <span class="sr-only">Send</span>
        <span class="text-lg leading-none">&#10148;</span>
      </button>
    </div>
  </div>
</template>

