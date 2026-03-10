<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import Tabs from '@/components/ui/Tabs.vue';

const route = useRoute();

const tabs = [
  { id: 'chats', label: 'Chats', href: '/app/chats' },
  { id: 'agents', label: 'Agents', href: '/app/agents' },
  { id: 'integrations', label: 'Integrations', href: '/app/integrations' },
  { id: 'settings', label: 'Settings', href: '/app/settings' },
];

const activeTabId = computed(() => {
  const segments = route.path.split('/');
  const section = segments[2] || 'chats';
  const match = tabs.find((tab) => tab.id === section);
  return match ? match.id : 'chats';
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg-page">
    <header
      class="w-full border-b border-border-subtle bg-bg-surface"
    >
      <div class="max-w-5xl mx-auto px-2 py-2 flex items-center justify-center">
        <Tabs :items="tabs" :model-value="activeTabId" size="large" />
      </div>
    </header>

    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-4 py-8">
        <RouterView />
      </div>
    </main>
  </div>
</template>

