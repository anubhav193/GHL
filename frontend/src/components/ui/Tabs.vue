<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

type TabsSize = 'small' | 'base' | 'large';

interface TabItem {
  id: string;
  label: string;
  href?: string;
}

interface Props {
  items: TabItem[];
  modelValue?: string;
  size?: TabsSize;
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'base',
  modelValue: undefined,
  fullWidth: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const route = useRoute();

const containerClasses = computed(() => {
  const base =
    'inline-flex items-center gap-2 rounded-md bg-bg-surface-subtle px-2 border border-border-subtle';
  const width = props.fullWidth ? 'w-full justify-between' : 'justify-center';
  return [base, width].join(' ');
});

const sizeClasses = computed(() => {
  const map: Record<TabsSize, string> = {
    small: 'h-8 px-3 text-xs',
    base: 'h-9 px-4 text-sm',
    large: 'h-11 px-5 text-sm',
  };
  return map[props.size];
});

const isActive = (item: TabItem) => {
  if (item.href) {
    return route.path === item.href;
  }
  return props.modelValue === item.id;
};

const tabClasses = (item: TabItem) => {
  const active = isActive(item);

  const base =
    'relative inline-flex items-center justify-center rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page';

  const state = active
    ? 'text-text-primary'
    : 'text-text-muted';

  return [base, sizeClasses.value, state, 'cursor-pointer select-none'].join(
    ' ',
  );
};

const handleClick = (item: TabItem) => {
  if (!item.href) {
    emit('update:modelValue', item.id);
  }
};
</script>

<template>
  <nav class="flex w-full justify-center">
    <div :class="containerClasses" role="tablist">
      <template v-for="item in items" :key="item.id">
        <RouterLink
          v-if="item.href"
          :to="item.href"
          role="tab"
          :aria-selected="isActive(item)"
          :class="tabClasses(item)"
        >
          <span>{{ item.label }}</span>
          <span
            class="pointer-events-none absolute inset-x-0 bottom-0 block rounded-full"
            :class="isActive(item) ? 'h-[3px] bg-primary' : 'h-[3px] bg-transparent'"
          />
        </RouterLink>
        <button
          v-else
          type="button"
          role="tab"
          :aria-selected="isActive(item)"
          :class="tabClasses(item)"
          @click="handleClick(item)"
        >
          <span>{{ item.label }}</span>
          <span
            class="pointer-events-none absolute inset-x-0 bottom-0 block rounded-full"
            :class="isActive(item) ? 'h-[3px] bg-primary' : 'h-[3px] bg-transparent'"
          />
        </button>
      </template>
    </div>
  </nav>
</template>

