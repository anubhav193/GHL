<script setup lang="ts">
import { provide, toRef } from 'vue';

interface Props {
  modelValue: string | number | null;
  name: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
}>();

type RadioGroupContext = {
  name: string;
  value: typeof props.modelValue;
  update: (value: string | number | null) => void;
};

const context: RadioGroupContext = {
  name: props.name,
  value: toRef(props, 'modelValue'),
  update: (value) => emit('update:modelValue', value),
};

provide('radio-group', context);
</script>

<template>
  <div class="flex flex-col gap-2">
    <slot />
  </div>
</template>

