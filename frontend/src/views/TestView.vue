<script setup lang="ts">
import { onMounted, ref } from 'vue';

const message = ref('hello world');
const apiResponse = ref<string | null>(null);
const error = ref<string | null>(null);

onMounted(async () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/test`);
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const data = await res.json();
    apiResponse.value = JSON.stringify(data, null, 2);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  }
});
</script>

<template>
  <main class="min-h-screen flex flex-col items-center justify-center gap-4">
    <h1 class="text-2xl font-semibold">
      {{ message }}
    </h1>
    <section class="w-full max-w-xl px-4">
      <p v-if="error" class="text-red-500">
        Failed to load API response: {{ error }}
      </p>
      <pre
        v-else-if="apiResponse"
        class="bg-neutral-900 text-neutral-100 p-4 rounded-md text-sm overflow-auto"
      >
{{ apiResponse }}</pre
      >
      <p v-else class="text-neutral-500">Loading API response...</p>
    </section>
  </main>
</template>

