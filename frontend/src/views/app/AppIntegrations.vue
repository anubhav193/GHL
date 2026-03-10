<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Spinner from '@/components/ui/Spinner.vue';
import type { IntegrationListItem } from '@/api/client';
import {
  createIntegrationConnectSession,
  disconnectIntegration,
  getIntegrations,
} from '@/api/client';
import { useToast } from '@/composables/useToast';

const integrations = ref<IntegrationListItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const connectingIntegrationId = ref<number | null>(null);
const disconnectingIntegrationId = ref<number | null>(null);

const { showToast } = useToast();

async function loadIntegrations(options?: { force?: boolean }) {
  try {
    isLoading.value = true;
    error.value = null;

    const { integrations: items } = await getIntegrations({
      force: options?.force,
    });

    integrations.value = items;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to load integrations.';
  } finally {
    isLoading.value = false;
  }
}

async function handleConnect(integration: IntegrationListItem) {
  if (connectingIntegrationId.value === integration.id) return;

  connectingIntegrationId.value = integration.id;
  error.value = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nangoGlobal = (window as any).Nango;
  let popup: Window | null = null;

  try {
    const { session } = await createIntegrationConnectSession(integration.id);

    // Prefer the Nango Connect UI if available – this resolves when the flow completes.
    if (nangoGlobal && typeof nangoGlobal.connect === 'function') {
      await nangoGlobal.connect({ token: session.token });
      await loadIntegrations({ force: true });
      return;
    }

    // Fallback: open the hosted connect link in a popup instead of navigating away.
    if (session.connect_link) {
      const popupWidth = 720;
      const popupHeight = 900;
      const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
      const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
      const screenWidth =
        window.innerWidth ?? document.documentElement.clientWidth;
      const screenHeight =
        window.innerHeight ?? document.documentElement.clientHeight;

      const left = dualScreenLeft + (screenWidth - popupWidth) / 2;
      const top = dualScreenTop + (screenHeight - popupHeight) / 2;

      popup = window.open(
        session.connect_link,
        'nango_connect',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`,
      );

      if (!popup) {
        throw new Error(
          'Popup was blocked. Please allow popups for this site and try again.',
        );
      }

      const timeoutMs = 2 * 60 * 1000; // 2 minutes

      await new Promise<void>((resolve, reject) => {
        const start = Date.now();

        const interval = window.setInterval(() => {
          const hasTimedOut = Date.now() - start > timeoutMs;

          if (!popup || popup.closed) {
            window.clearInterval(interval);
            resolve();
            return;
          }

          if (hasTimedOut) {
            window.clearInterval(interval);
            reject(
              new Error(
                'Connection was not completed. Please finish the flow in the popup and try again.',
              ),
            );
          }
        }, 500);
      });

      const { integrations: latest } = await getIntegrations({ force: true });
      integrations.value = latest;

      const updated = latest.find((item) => item.id === integration.id);

      if (!updated || updated.status !== 'connected') {
        throw new Error(
          'Connection was not completed. Please finish the flow in the popup and try again.',
        );
      }

      return;
    }

    throw new Error('No connect link available for this integration.');
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect integration.';

    if (message.startsWith('Connection was not completed')) {
      showToast(message);
    } else {
      error.value = message;
    }
  } finally {
    if (popup && !popup.closed) {
      popup.close();
    }
    connectingIntegrationId.value = null;
  }
}

function openModifyModal(integration: IntegrationListItem) {
  selectedIntegration.value = integration;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  selectedIntegration.value = null;
}

async function handleDisconnect(integration: IntegrationListItem) {
  if (disconnectingIntegrationId.value === integration.id) return;

  if (!integration.connectionId) {
    error.value = 'No active connection found for this integration.';
    return;
  }

  disconnectingIntegrationId.value = integration.id;

  try {
    await disconnectIntegration(integration.id, integration.connectionId);
    await loadIntegrations({ force: true });
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to disconnect integration.';
  } finally {
    disconnectingIntegrationId.value = null;
  }
}

onMounted(() => {
  loadIntegrations();
});
</script>

<template>
  <section class="space-y-4">
    <header class="space-y-1">
      <p class="text-xs uppercase tracking-wide text-text-subtle">
        App / Integrations
      </p>
      <h1 class="text-xl font-semibold text-text-primary">
        Integrations
      </h1>
      <p class="text-xs text-text-muted">
        Connect your workspace to external tools and data sources.
      </p>
    </header>

    <Card>

      <div class="space-y-3">
        <p v-if="error" class="text-xs text-red-500">
          {{ error }}
        </p>

        <div
          v-if="isLoading"
          class="flex items-center justify-center py-8"
        >
          <Spinner :size="20" />
        </div>

        <p
          v-else-if="!integrations.length"
          class="text-sm text-text-muted py-10 text-center"
        >
          No integrations are available yet. Configure them in your Nango
          dashboard.
        </p>

        <ul
          v-else
          class="divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface-elevated"
        >
          <li
            v-for="integration in integrations"
            :key="integration.id"
            class="flex items-center justify-between gap-4 p-3"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-md bg-surface-sunken text-xs font-semibold text-text-secondary"
              >
                <img
                  v-if="integration.logoUrl"
                  :src="integration.logoUrl"
                  :alt="integration.name ?? integration.provider"
                  class="h-6 w-6 object-contain"
                />
                <span v-else>
                  {{ (integration.name ?? integration.provider).charAt(0).toUpperCase() }}
                </span>
              </div>

              <div class="space-y-0.5">
                <p class="text-sm font-medium text-text-primary">
                  {{ integration.name ?? integration.provider }}
                </p>
                <p class="text-xs text-text-muted">
                  Provider: {{ integration.provider }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div class="w-[110px]">
                  <Button
                    v-if="integration.status === 'connected'"
                    size="sm"
                    variant="danger"
                    class="w-full"
                    :loading="disconnectingIntegrationId === integration.id"
                    :disabled="disconnectingIntegrationId === integration.id"
                    @click="handleDisconnect(integration)"
                  >
                    Disconnect
                  </Button>
                  <Button
                    v-else
                    size="sm"
                    variant="primary"
                    class="w-full"
                    :loading="connectingIntegrationId === integration.id"
                    :disabled="connectingIntegrationId === integration.id"
                    @click="handleConnect(integration)"
                  >
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </Card>

  </section>
</template>
