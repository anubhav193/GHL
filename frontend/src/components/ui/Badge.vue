<script setup lang="ts">
type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
  variant?: BadgeVariant;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
});

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-bg-surface-subtle text-text-secondary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    :class="variantClasses[variant]"
  >
    <slot />
  </span>
</template>

