<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import { signin } from '@/api/client';
import { useAuth } from '@/composables/useAuth';

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const router = useRouter();
const route = useRoute();
const { state, fetchCurrentUser, setUser } = useAuth();

onMounted(async () => {
  if (!state.hasLoadedOnce && !state.isLoadingUser) {
    await fetchCurrentUser();
  }
});

const handleSubmit = async () => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    const { user } = await signin({
      email: email.value.trim(),
      password: password.value,
    });

    setUser(user);

    const redirect = (route.query.redirect as string | undefined) ?? '/app';
    router.push(redirect);
  } catch (error: any) {
    errorMessage.value =
      error?.message ?? 'Something went wrong. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <main class="min-h-screen bg-bg-page">
    <section
      class="mx-auto flex min-h-screen max-w-page-content flex-col justify-center px-8 py-10"
    >
      <div
        class="max-w-[600px] mx-auto"
      >
        <!-- Left: copy + login -->
        <div class="space-y-8">
          <div class="space-y-3">
            <div
              class="inline-flex items-center gap-2 rounded-pill border border-border-subtle bg-bg-surface-subtle px-3 py-1 text-xs font-medium uppercase tracking-wide text-text-subtle"
            >
              <span class="h-1.5 w-1.5 rounded-pill bg-primary" />
              <span>Agent Studio</span>
            </div>
            <h1 class="text-3xl font-semibold leading-tight text-text-primary md:text-4xl">
              Build AI agents that take real actions in your apps
            </h1>
            <p class="w-full text-sm leading-relaxed text-text-secondary">
              Connect tools like Gmail, GitHub, and Slack. Configure AI agents that can read
              emails, create issues, and send messages autonomously.
            </p>
          </div>

          <div
            class="w-full rounded-lg bg-bg-surface p-6 shadow-card border border-border-subtle"
          >
            <div v-if="state.currentUser" class="space-y-4">
              <div class="space-y-1">
                <p class="text-sm font-medium text-text-primary">
                  You’re already logged in
                </p>
                <p class="text-xs text-text-muted">
                  Signed in as
                  <span class="font-medium text-text-secondary">
                    {{ state.currentUser.firstName }} {{ state.currentUser.lastName }}
                  </span>
                  (<span class="font-mono text-[11px]">{{ state.currentUser.email }}</span
                  >).
                </p>
              </div>

              <Button href="/app" full-width>
                Go to app
              </Button>
            </div>

            <form v-else class="space-y-4" @submit.prevent="handleSubmit">
              <div class="space-y-1.5">
                <label for="email" class="text-xs font-medium text-text-secondary">
                  Email
                </label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  required
                  class="block w-full rounded-sm border border-border-subtle bg-bg-surface-subtle px-3 py-2 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus-raised"
                  placeholder="you@example.com"
                />
              </div>

              <div class="space-y-1.5">
                <label for="password" class="text-xs font-medium text-text-secondary">
                  Password
                </label>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  autocomplete="current-password"
                  required
                  class="block w-full rounded-sm border border-border-subtle bg-bg-surface-subtle px-3 py-2 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus-raised"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                :loading="isSubmitting"
                full-width
              >
                Sign in
              </Button>

              <p v-if="errorMessage" class="text-xs text-danger">
                {{ errorMessage }}
              </p>

              <p class="text-xs text-text-muted">
                Don’t have an account?
                <Button
                  variant="link"
                  href="/signup"
                  class="ml-1 align-baseline"
                >
                  Create an account
                </Button>
              </p>
            </form>
          </div>
        </div>
      </div>

    </section>
  </main>
</template>

<style scoped>
.agent-pulse {
  animation: agentPulse 4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.link-path {
  stroke-dasharray: 6 10;
  stroke-dashoffset: 0;
  animation: linkFlow 10s linear infinite;
}

.link-path-2 {
  animation-delay: -3s;
}

.link-path-3 {
  animation-delay: -6s;
}

.service-node {
  animation: nodeFloat 8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.service-node--github {
  animation-delay: -2s;
}

.service-node--slack {
  animation-delay: -4s;
}

.icon-bounce {
  animation: iconBounce 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.icon-orbit {
  animation: iconOrbit 6s linear infinite;
  transform-origin: center;
}

.icon-pulse {
  animation: iconPulse 3.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.how-icon-surface {
  fill: currentColor;
  opacity: 0.08;
}

@keyframes agentPulse {
  0% {
    transform: scale(0.98);
    opacity: 0.7;
  }
  40% {
    transform: scale(1.04);
    opacity: 1;
  }
  100% {
    transform: scale(0.98);
    opacity: 0.7;
  }
}

@keyframes linkFlow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -80;
  }
}

@keyframes nodeFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes iconBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-3px);
  }
  60% {
    transform: translateY(0);
  }
}

@keyframes iconOrbit {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.06);
  }
}
</style>

