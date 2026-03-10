<script setup lang="ts">
import { useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { state, logout } = useAuth();

const handleLogout = async () => {
  await logout();
  router.push('/');
};
</script>

<template>
  <section class="space-y-4">
    <header class="space-y-1">
      <p class="text-xs uppercase tracking-wide text-text-subtle">
        App / Settings
      </p>
      <h1 class="text-xl font-semibold text-text-primary">
        Settings
      </h1>
      <p class="text-xs text-text-muted">
        Account settings for your AI agent studio.
      </p>
    </header>

    <Card>
      <div class="flex items-center justify-between gap-4">
        <div class="space-y-1">
          <p class="text-sm font-medium text-text-primary">
            You’re logged in as
            <span class="font-semibold text-text-secondary">
              {{ state.currentUser?.firstName }} {{ state.currentUser?.lastName }}
            </span>
          </p>
          <p class="text-xs text-text-muted">
            {{ state.currentUser?.email }}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          @click="handleLogout"
        >
          Log out
        </Button>
      </div>
    </Card>
  </section>
</template>

