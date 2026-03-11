<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue';
import Button from '@/components/ui/Button.vue';

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

const textareaRef = ref<HTMLTextAreaElement | null>(null);

function adjustHeight() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = '39px';
  el.style.height = `${Math.min(100, Math.max(39, el.scrollHeight))}px`;
}

// Keep textarea height in sync when the bound value changes from the parent
// (e.g. cleared after submit).
watch(
  () => props.modelValue,
  () => {
    nextTick(adjustHeight);
  },
);

onMounted(() => {
  nextTick(adjustHeight);
});

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
  nextTick(adjustHeight);
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
      ref="textareaRef"
      class="min-h-[39px] max-h-[100px] flex-1 resize-none border-none bg-transparent px-1 py-2 text-sm text-text-primary outline-none placeholder:text-text-subtle"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="modelValue"
      rows="1"
      @input="onInput"
      @keydown="onKeydown"
    />
    <div class="flex items-center gap-1">
      <slot name="secondary" />
      <Button
        variant="icon"
        type="button"
        :disabled="disabled || !modelValue"
        @click="emit('submit')"
      >
        &#10148;
      </Button>
    </div>
  </div>
</template>

