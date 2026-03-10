<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import { useAuth } from '@/composables/useAuth';

const { state, logout } = useAuth();

const handleLogout = async () => {
  await logout();
  window.location.href = '/';
};
</script>

<template>
  <main class="min-h-screen bg-bg-page flex items-center justify-center px-4">
    <section
      class="w-full max-w-[480px] rounded-lg bg-bg-surface shadow-card border border-border-subtle p-6 space-y-4"
    >
      <header class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-text-subtle">
          App / Dummy
        </p>
        <h1 class="text-xl font-semibold text-text-primary">
          Authenticated dummy page
        </h1>
        <p class="text-xs text-text-muted">
          This page is only visible when you are signed in.
        </p>
      </header>

      <div v-if="state.currentUser" class="space-y-2 text-sm">
        <p class="text-text-secondary">
          Logged in as
          <span class="font-medium text-text-primary">
            {{ state.currentUser.firstName }} {{ state.currentUser.lastName }}
          </span>
        </p>
        <p class="text-xs text-text-muted">
          Email:
          <span class="font-mono text-[11px]">
            {{ state.currentUser.email }}
          </span>
        </p>
      </div>

      <div v-else class="text-xs text-danger">
        No user loaded. You might not be authenticated.
      </div>

      <div class="pt-2">
        <Button variant="outline" full-width @click="handleLogout">
          Log out
        </Button>
      </div>
    </section>
  </main>
</template>

