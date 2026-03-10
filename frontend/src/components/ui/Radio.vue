<script setup lang="ts">
import { inject } from 'vue';

interface Props {
  value: string | number;
  label?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  label: undefined,
});

type RadioGroupContext = {
  name: string;
  value: { value: string | number | null };
  update: (value: string | number | null) => void;
};

const group = inject<RadioGroupContext | null>('radio-group', null);

const onChange = () => {
  if (!group) return;
  group.update(props.value);
};
</script>

<template>
  <label
    class="inline-flex items-center gap-2 text-sm text-text-secondary"
    :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
  >
    <span
      class="relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-border-subtle bg-bg-surface shadow-sm transition-colors data-[checked=true]:border-primary"
      :data-checked="group && group.value.value === value"
    >
      <input
        type="radio"
        class="absolute inset-0 h-full w-full cursor-inherit opacity-0"
        :name="group?.name"
        :value="value"
        :checked="group ? group.value.value === value : false"
        :disabled="disabled"
        @change="onChange"
      />
      <span
        v-if="group && group.value.value === value"
        class="h-2 w-2 rounded-full bg-primary"
      />
    </span>
    <span v-if="label">
      {{ label }}
    </span>
  </label>
</template>

