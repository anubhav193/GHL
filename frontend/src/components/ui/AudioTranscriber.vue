<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Props {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  lang: 'en-US',
  continuous: true,
  interimResults: true,
  label: 'Voice input',
});

const emit = defineEmits<{
  (e: 'update:transcript', value: string): void;
  (e: 'start'): void;
  (e: 'stop'): void;
  (e: 'error', message: string): void;
}>();

type AnyRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

const isSupported = ref(true);
const isRecording = ref(false);
const committedTranscript = ref('');
const interimTranscript = ref('');
const errorMessage = ref<string | null>(null);

let recognition: AnyRecognition | null = null;

const combinedTranscript = computed(() =>
  committedTranscript.value + (interimTranscript.value ? ` ${interimTranscript.value}` : ''),
);

watch(
  combinedTranscript,
  (value) => {
    emit('update:transcript', value);
  },
  { immediate: true },
);

const statusLabel = computed(() => {
  if (!isSupported.value) return 'Not supported in this browser';
  if (errorMessage.value) return errorMessage.value;
  if (isRecording.value) return 'Listening… Speak into your microphone';
  if (combinedTranscript.value) return 'Recording stopped. You can resume or edit the text below.';
  return 'Click the microphone to start recording.';
});

const canRecord = computed(() => isSupported.value && !errorMessage.value);

const initRecognition = () => {
  try {
    const root = window as unknown as {
      webkitSpeechRecognition?: new () => AnyRecognition;
      SpeechRecognition?: new () => AnyRecognition;
    };

    const Ctor = root.SpeechRecognition ?? root.webkitSpeechRecognition;

    if (!Ctor) {
      isSupported.value = false;
      return;
    }

    recognition = new Ctor();
    recognition.lang = props.lang;
    recognition.continuous = props.continuous;
    recognition.interimResults = props.interimResults;
    recognition.onstart = () => {
      isRecording.value = true;
      errorMessage.value = null;
      emit('start');
    };
    recognition.onend = () => {
      isRecording.value = false;
      interimTranscript.value = '';
      emit('stop');
    };
    recognition.onerror = (event) => {
      const message = event?.error ?? 'Unknown microphone error';
      errorMessage.value = message;
      isRecording.value = false;
      emit('error', message);
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        committedTranscript.value = `${committedTranscript.value} ${finalText}`.trim();
      }

      interimTranscript.value = interimText.trim();
    };
  } catch {
    isSupported.value = false;
  }
};

const startRecording = () => {
  if (!canRecord.value || !recognition || isRecording.value) return;
  try {
    recognition.start();
  } catch {
    // Some implementations throw if start is called twice; ignore.
  }
};

const stopRecording = () => {
  if (!recognition || !isRecording.value) return;
  recognition.stop();
};

onMounted(() => {
  initRecognition();
});

onBeforeUnmount(() => {
  if (recognition && isRecording.value) {
    recognition.stop();
  }
  recognition = null;
});
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-md border border-border-subtle bg-bg-surface-subtle p-4"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="space-y-1">
        <p class="text-xs font-medium uppercase tracking-wide text-text-subtle">
          {{ label }}
        </p>
        <p class="text-xs text-text-muted">
          {{ statusLabel }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-bg-surface shadow-card transition-colors"
        :class="[
          canRecord
            ? isRecording
              ? 'text-danger bg-danger-soft hover:bg-danger-soft/80'
              : 'text-primary hover:bg-primary-soft'
            : 'opacity-60 cursor-not-allowed',
        ]"
        :disabled="!canRecord"
        :aria-pressed="isRecording ? 'true' : 'false'"
        @click="isRecording ? stopRecording() : startRecording()"
      >
        <span v-if="isRecording" class="h-3 w-3 rounded-full bg-danger" />
        <span v-else class="h-4 w-4 rounded-[6px] border-2 border-current" />
      </button>
    </div>

    <textarea
      class="mt-1 min-h-[96px] w-full resize-y rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
      :value="combinedTranscript"
      placeholder="Live transcript will appear here as you speak…"
      @input="
        (event) => {
          const target = event.target as HTMLTextAreaElement;
          committedTranscript = target.value;
          interimTranscript = '';
        }
      "
    />
  </div>
</template>

