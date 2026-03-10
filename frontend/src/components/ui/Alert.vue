<script setup lang="ts">
type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface Props {
  variant?: AlertVariant;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  title: undefined,
});

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-info-soft text-info border-info/40',
  success: 'bg-success-soft text-success border-success/40',
  warning: 'bg-warning-soft text-warning border-warning/40',
  danger: 'bg-danger-soft text-danger border-danger/40',
};
</script>

<template>
  <div
    class="flex gap-3 rounded-md border px-3 py-2 text-sm"
    :class="variantClasses[variant]"
  >
    <div class="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-current/10" />
    <div class="space-y-1">
      <p v-if="title" class="font-medium">
        {{ title }}
      </p>
      <p>
        <slot />
      </p>
    </div>
  </div>
</template>

