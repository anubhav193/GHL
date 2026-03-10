<script setup lang="ts">
interface Props {
  text: string;
}

const props = defineProps<Props>();
</script>

<template>
  <span class="group relative inline-flex">
    <slot />
    <span
      class="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-card group-hover:block"
    >
      {{ text }}
    </span>
  </span>
</template>

