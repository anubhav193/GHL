<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
</script>

<template>
  <section class="space-y-4">
    <header class="space-y-1">
      <p class="text-xs uppercase tracking-wide text-text-subtle">
        App / Chats
      </p>
      <h1 class="text-xl font-semibold text-text-primary">
        Chats
      </h1>
      <p class="text-xs text-text-muted">
        This is a placeholder for your AI chat workspace. Your conversations
        and history will appear here.
      </p>
    </header>

    <Card>
      <template #header>
        <h2 class="text-sm font-medium text-text-secondary">
          Chats overview
        </h2>
      </template>

      <p class="text-sm text-text-muted">
        Start designing the main chat experience here. You can add a chat
        timeline, input bar, and tools for interacting with your agents.
      </p>
    </Card>
  </section>
</template>

