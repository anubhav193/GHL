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

    const redirect = (route.query.redirect as string | undefined) ?? '/app/dummy';
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
        class="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center"
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

        <!-- Right: illustration -->
        <div
          class="relative rounded-lg bg-bg-surface-elevated p-6 shadow-card border border-border-subtle overflow-hidden"
        >
          <div
            class="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            class="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
          />

          <div class="relative">
            <p class="mb-4 text-xs font-medium uppercase tracking-wide text-text-subtle">
              Autonomous agent orchestration
            </p>
            <svg
              viewBox="0 0 360 260"
              class="h-auto w-full"
              role="img"
              aria-label="Agent connecting to apps like Gmail, GitHub, and Slack"
            >
              <defs>
                <radialGradient id="agentGlow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
                  <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
                </radialGradient>
              </defs>

              <!-- Agent glow -->
              <g class="agent-glow text-primary">
                <circle
                  cx="180"
                  cy="130"
                  r="70"
                  fill="url(#agentGlow)"
                  class="agent-pulse"
                />
              </g>

              <!-- Connection lines -->
              <g
                class="text-primary"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              >
                <path
                  class="link-path link-path-1"
                  d="M 180 120 C 210 90 245 80 280 80"
                />
                <path
                  class="link-path link-path-2"
                  d="M 180 135 C 210 140 245 165 280 180"
                />
                <path
                  class="link-path link-path-3"
                  d="M 180 135 C 150 140 120 160 90 175"
                />
              </g>

              <!-- Central agent node -->
              <g class="agent-node text-primary">
                <circle
                  cx="180"
                  cy="130"
                  r="26"
                  fill="currentColor"
                  class="agent-core"
                />
                <circle
                  cx="180"
                  cy="130"
                  r="22"
                  fill="none"
                  stroke="url(#agentGlow)"
                  stroke-width="1.6"
                />
                <circle
                  cx="180"
                  cy="130"
                  r="13"
                  class="agent-inner text-bg-surface"
                  fill="currentColor"
                />
                <circle
                  cx="180"
                  cy="130"
                  r="7"
                  class="agent-inner-core text-bg-page"
                  fill="currentColor"
                />
              </g>

              <!-- Gmail node -->
              <g
                class="service-node service-node--gmail text-primary"
                transform="translate(280, 76)"
              >
                <rect
                  x="-26"
                  y="-18"
                  width="52"
                  height="36"
                  rx="8"
                  ry="8"
                  class="service-card text-bg-surface"
                  fill="currentColor"
                />
                <rect
                  x="-24"
                  y="-16"
                  width="48"
                  height="32"
                  rx="6"
                  ry="6"
                  class="service-card-soft text-primary-soft"
                  fill="currentColor"
                />
                <path
                  d="M -22 -10 L 0 4 L 22 -10"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                />
              </g>

              <!-- GitHub node -->
              <g
                class="service-node service-node--github text-primary"
                transform="translate(282, 183)"
              >
                <rect
                  x="-24"
                  y="-18"
                  width="48"
                  height="36"
                  rx="18"
                  ry="18"
                  class="service-card text-bg-surface"
                  fill="currentColor"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="13"
                  class="service-card-soft text-primary-soft"
                  fill="currentColor"
                />
                <path
                  d="M -5 2 C -5 0 -4 -1 -4 -2 C -4 -4 -3 -5 -1 -5 C 0 -5 1 -4 1 -3 C 2 -3 3 -3 4 -2 C 4 -1 4 0 4 2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                />
              </g>

              <!-- Slack node -->
              <g
                class="service-node service-node--slack text-accent"
                transform="translate(90, 176)"
              >
                <rect
                  x="-26"
                  y="-18"
                  width="52"
                  height="36"
                  rx="10"
                  ry="10"
                  class="service-card text-bg-surface"
                  fill="currentColor"
                />
                <g
                  class="slack-mark text-primary-soft"
                  fill="currentColor"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                >
                  <path d="M -9 -3 h 6 a 3 3 0 0 1 0 6 h -6 a 3 3 0 0 1 0 -6" />
                  <path d="M 3 -3 h 6 a 3 3 0 0 1 0 6 h -6 a 3 3 0 0 1 0 -6" />
                  <path d="M -3 -9 v 6 a 3 3 0 0 1 -6 0 v -6 a 3 3 0 0 1 6 0" />
                  <path d="M -3 3 v 6 a 3 3 0 0 1 -6 0 v -6 a 3 3 0 0 1 6 0" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- Optional: How it works -->
      <section class="mt-12 border-t border-border-divider pt-8">
        <div class="grid gap-6 md:grid-cols-3">
          <div
            class="rounded-md bg-bg-surface p-4 shadow-card border border-border-subtle transition-[transform,box-shadow,border-color] hover:-translate-y-px hover:border-primary hover:shadow-popover"
          >
            <div class="mb-3 flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-pill bg-primary-soft text-primary"
              >
                <svg
                  viewBox="0 0 32 32"
                  class="h-5 w-5 icon-bounce"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="4"
                    y="7"
                    width="9"
                    height="7"
                    rx="2"
                    class="how-icon-surface"
                  />
                  <rect
                    x="19"
                    y="18"
                    width="9"
                    height="7"
                    rx="2"
                    class="how-icon-surface"
                  />
                  <path
                    d="M 13 10 H 19"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                  />
                  <path
                    d="M 23 18 V 14"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
              <p class="text-sm font-medium text-text-primary">Connect Apps</p>
            </div>
            <p class="text-xs leading-relaxed text-text-muted">
              Securely link Gmail, GitHub, Slack, and more in a few clicks.
            </p>
          </div>

          <div
            class="rounded-md bg-bg-surface p-4 shadow-card border border-border-subtle transition-[transform,box-shadow,border-color] hover:-translate-y-px hover:border-primary hover:shadow-popover"
          >
            <div class="mb-3 flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-pill bg-primary-soft text-primary"
              >
                <svg
                  viewBox="0 0 32 32"
                  class="h-5 w-5 icon-orbit"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="16"
                    cy="16"
                    r="4"
                    class="how-icon-surface"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="8"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-dasharray="2 4"
                  />
                  <circle
                    cx="9"
                    cy="16"
                    r="1.6"
                    class="how-icon-surface"
                  />
                  <circle
                    cx="23"
                    cy="16"
                    r="1.6"
                    class="how-icon-surface"
                  />
                </svg>
              </div>
              <p class="text-sm font-medium text-text-primary">Build Your Agent</p>
            </div>
            <p class="text-xs leading-relaxed text-text-muted">
              Define behaviors, guardrails, and tools in a structured canvas.
            </p>
          </div>

          <div
            class="rounded-md bg-bg-surface p-4 shadow-card border border-border-subtle transition-[transform,box-shadow,border-color] hover:-translate-y-px hover:border-primary hover:shadow-popover"
          >
            <div class="mb-3 flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-pill bg-primary-soft text-primary"
              >
                <svg
                  viewBox="0 0 32 32"
                  class="h-5 w-5 icon-pulse"
                  fill="none"
                  aria-hidden="true"
                >
                  <polyline
                    points="4 18 11 18 15 10 19 22 23 14 28 14"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <rect
                    x="6"
                    y="20"
                    width="4"
                    height="4"
                    class="how-icon-surface"
                  />
                </svg>
              </div>
              <p class="text-sm font-medium text-text-primary">Let It Execute Actions</p>
            </div>
            <p class="text-xs leading-relaxed text-text-muted">
              Deploy agents that monitor events and take actions on your behalf.
            </p>
          </div>
        </div>
      </section>
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

