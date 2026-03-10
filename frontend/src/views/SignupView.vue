<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signup } from '@/api/client';
import Button from '@/components/ui/Button.vue';

const router = useRouter();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const handleSubmit = async () => {
  if (isSubmitting.value) return;

  errorMessage.value = null;
  successMessage.value = null;
  isSubmitting.value = true;

  try {
    await signup({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });

    successMessage.value = 'Account created successfully.';
  } catch (error: any) {
    errorMessage.value = error?.message ?? 'Something went wrong. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

const goToLogin = () => {
  router.push('/');
};
</script>

<template>
  <main class="min-h-screen bg-bg-page flex items-center justify-center px-4">
    <section
      class="w-full max-w-[500px] rounded-lg bg-bg-surface shadow-card border border-border-subtle p-6"
    >
      <!-- Form state -->
      <div v-if="!successMessage">
        <header class="mb-4 space-y-1">
          <h1 class="text-xl font-semibold text-text-primary">Create your account</h1>
          <p class="text-xs text-text-muted">
            Sign up with your details to get started.
          </p>
        </header>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label for="firstName" class="text-xs font-medium text-text-secondary">
                First name
              </label>
              <input
                id="firstName"
                v-model="firstName"
                type="text"
                autocomplete="given-name"
                required
                class="block w-full rounded-sm border border-border-subtle bg-bg-surface-subtle px-3 py-2 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus-raised"
                placeholder="Jane"
              />
            </div>

            <div class="space-y-1.5">
              <label for="lastName" class="text-xs font-medium text-text-secondary">
                Last name
              </label>
              <input
                id="lastName"
                v-model="lastName"
                type="text"
                autocomplete="family-name"
                required
                class="block w-full rounded-sm border border-border-subtle bg-bg-surface-subtle px-3 py-2 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus-raised"
                placeholder="Doe"
              />
            </div>
          </div>

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
              autocomplete="new-password"
              required
              minlength="8"
              class="block w-full rounded-sm border border-border-subtle bg-bg-surface-subtle px-3 py-2 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus-raised"
              placeholder="At least 8 characters"
            />
          </div>

          <div v-if="errorMessage" class="text-xs text-danger mt-1">
            {{ errorMessage }}
          </div>
          <Button
            type="submit"
            :loading="isSubmitting"
            full-width
            class="mt-2"
          >
            Sign up
          </Button>
        </form>

        <p class="mt-4 text-center text-xs text-text-muted">
          Already have an account?
          <Button variant="link" href="/" class="ml-1 align-baseline">
            Sign in
          </Button>
        </p>
      </div>

      <!-- Success state -->
      <div
        v-else
        class="text-center space-y-4"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-7 w-7 text-success"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm4.3 8.3-4.25 4.25a1 1 0 0 1-1.42 0l-2.15-2.15a1 1 0 0 1 1.42-1.42l1.44 1.44 3.54-3.54a1 1 0 0 1 1.42 1.42Z"
            />
          </svg>
        </div>

        <div class="space-y-1">
          <p class="text-xl font-semibold text-text-primary">
            Account created
          </p>
          <p class="text-xs text-text-muted">
            You can now sign in with your new credentials.
          </p>
        </div>

        <Button full-width variant="primary" @click="goToLogin">
          Login now
        </Button>
      </div>
    </section>
  </main>
</template>

