<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger' | 'link' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  external?: boolean;
  target?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  fullWidth: false,
  loading: false,
  disabled: false,
  type: 'button',
  href: undefined,
  external: false,
  target: undefined,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page disabled:pointer-events-none disabled:opacity-60 disabled:cursor-default';

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'rounded-md bg-primary text-text-on-primary shadow-card hover:bg-primary-strong/95',
    secondary:
      'rounded-md bg-bg-surface text-text-secondary border border-border-subtle hover:bg-bg-surface-subtle',
    subtle:
      'rounded-md bg-transparent text-text-secondary hover:bg-bg-surface-subtle border border-transparent',
    danger:
      'rounded-md bg-danger text-text-on-primary shadow-card hover:bg-danger/90',
    link:
      'bg-transparent text-primary hover:text-primary-strong underline-offset-2 hover:underline rounded-none px-0 h-auto',
    icon:
      'bg-primary text-text-on-primary shadow-card hover:bg-primary-strong/95',
  };

  const width = props.fullWidth && props.variant !== 'link' ? 'w-full' : 'w-auto';
  const sizeClass =
    props.variant === 'link' || props.variant === 'icon'
      ? undefined
      : sizeClasses[props.size];

  const iconExtras =
    props.variant === 'icon'
      ? 'rounded-full h-10 w-10 aspect-square p-0 text-lg leading-none'
      : undefined;

  return [base, sizeClass, variantClasses[props.variant], width, iconExtras]
    .filter(Boolean)
    .join(' ');
});

const spinnerClasses = computed(() => {
  const base = 'h-4 w-4 animate-spin rounded-full border-2 border-transparent';

  const byVariant: Record<ButtonVariant, string> = {
    primary: 'text-text-on-primary border-t-current',
    secondary: 'text-primary border-t-current',
    subtle: 'text-primary border-t-current',
    danger: 'text-text-on-primary border-t-current',
    link: 'text-primary border-t-current',
    icon: 'text-text-on-primary border-t-current',
  };

  return [base, byVariant[props.variant]].join(' ');
});

const isLink = computed(() => !!props.href);
const isExternal = computed(() => isLink.value && props.external);
const isInternalRoute = computed(() => isLink.value && !props.external);

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault();
    return;
  }

  emit('click', event);
};
</script>

<template>
  <!-- Internal route: RouterLink -->
  <RouterLink
    v-if="isInternalRoute"
    :to="href!"
    :class="classes"
    :aria-busy="loading ? 'true' : undefined"
    :target="target"
    @click="handleClick"
  >
    <span v-if="loading" class="mr-2 inline-flex">
      <span :class="spinnerClasses" />
    </span>
    <span class="inline-flex items-center gap-1">
      <slot />
    </span>
  </RouterLink>

  <!-- External link: anchor -->
  <a
    v-else-if="isExternal"
    :href="href"
    :target="target || '_blank'"
    :rel="(target || '_blank') === '_blank' ? 'noreferrer noopener' : undefined"
    :class="classes"
    :aria-busy="loading ? 'true' : undefined"
    @click="handleClick"
  >
    <span v-if="loading" class="mr-2 inline-flex">
      <span :class="spinnerClasses" />
    </span>
    <span class="inline-flex items-center gap-1">
      <slot />
    </span>
  </a>

  <!-- Default: button element -->
  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    @click="handleClick"
  >
    <span v-if="loading" class="mr-2 inline-flex">
      <span :class="spinnerClasses" />
    </span>
    <span class="inline-flex items-center gap-1">
      <slot />
    </span>
  </button>
</template>

