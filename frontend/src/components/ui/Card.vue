<script setup lang="ts">
interface Props {
  padded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  padded: true,
});
</script>

<template>
  <section
    class="rounded-md border border-border-subtle bg-bg-surface shadow-card"
    :class="props.padded ? 'p-xl' : ''"
  >
    <header v-if="$slots.header" class="mb-4 flex items-center justify-between gap-3">
      <slot name="header" />
    </header>

    <div>
      <slot />
    </div>

    <footer v-if="$slots.footer" class="mt-4 pt-4 border-t border-border-divider">
      <slot name="footer" />
    </footer>
  </section>
</template>

