import { readonly, ref } from 'vue';
import type { Toast, ToastVariant } from '@/components/ui/ToastContainer.vue';

const toasts = ref<Toast[]>([]);
let nextId = 1;

function pushToast(message: string, variant: ToastVariant = 'info', duration = 5000) {
  const id = nextId++;
  const toast: Toast = { id, message, variant };
  toasts.value = [...toasts.value, toast];

  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, duration);
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    showToast: pushToast,
  };
}

