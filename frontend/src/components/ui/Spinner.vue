<script setup lang="ts">
interface Props {
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
});
</script>

<template>
  <span
    class="inline-block animate-spin rounded-full border-2 border-bg-surface border-t-primary"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>

