<template>
  <section class="max-w-3xl mx-auto px-4 py-12 animate-slide-up">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-6">
      <div class="h-10 bg-gray-800 rounded-xl animate-pulse w-1/2 mx-auto"/>
      <div class="card space-y-4">
        <div class="h-4 bg-gray-800 rounded animate-pulse"/>
        <div class="h-4 bg-gray-800 rounded animate-pulse w-4/5"/>
        <div class="h-4 bg-gray-800 rounded animate-pulse w-3/5"/>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="fetchError" class="card text-center py-16 space-y-5">
      <div class="text-5xl">⚠️</div>
      <h2 class="text-xl font-bold text-white">No s'ha pogut carregar el resultat</h2>
      <p class="text-gray-400 text-sm max-w-sm mx-auto">{{ fetchError }}</p>
      <RouterLink to="/camera" class="btn-primary mx-auto w-fit">
        ← Tornar a escanejar
      </RouterLink>
    </div>

    <!-- Result content -->
    <template v-else-if="result">
      <!-- Header -->
      <div class="mb-10 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                    bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-5">
          <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
          Anàlisi completada
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Recomanació del menú</h1>
        <p class="text-gray-400">Resultat filtrat per les teves preferències alimentàries i traduït al teu idioma.</p>
      </div>

      <!-- Audio player card -->
      <div class="card mb-6 space-y-4">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600
                      flex items-center justify-center shadow-lg shadow-brand-500/30">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15.536 8.464a5 5 0 010 7.072M12 6a6 6 0 110 12 6 6 0 010-12z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v6m0 0l-1.5-1.5M12 15l1.5-1.5"/>
            </svg>
          </div>
          <div>
            <p class="text-white font-semibold">Escolta la recomanació</p>
            <p class="text-gray-500 text-xs">Àudio generat per Cloud Text-to-Speech</p>
          </div>
          <!-- Language badge -->
          <span class="badge ml-auto">🌍 {{ languageLabel }}</span>
        </div>

        <!-- Native audio player -->
        <audio
          v-if="result.audio_public_url"
          :src="result.audio_public_url"
          controls
          preload="auto"
          class="w-full"
          aria-label="Recomanació de menú en àudio"
        />
        <div v-else class="text-gray-500 text-sm text-center py-4">
          No hi ha àudio disponible per a aquest anàlisi.
        </div>

        <!-- Play tip -->
        <p class="text-xs text-gray-600 text-center">
          💡 Si no s'inicia automàticament, prem el botó de reproducció.
        </p>
      </div>

      <!-- Translated text card -->
      <div class="card mb-6 space-y-4">
        <div class="flex items-center justify-between mb-1">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
            </svg>
            Text traduït i filtrat
          </h2>
          <!-- Copy to clipboard -->
          <button
            id="copy-text-btn"
            class="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300
                   transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            @click="copyText"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            {{ copied ? '✓ Copiat!' : 'Copiar' }}
          </button>
        </div>

        <div
          class="text-gray-300 leading-relaxed whitespace-pre-wrap rounded-xl
                 bg-gray-800/60 p-5 border border-gray-700/50 text-sm"
        >
          {{ result.translated_text || 'No hi ha text disponible.' }}
        </div>
      </div>

      <!-- Metadata strip -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <MetadataChip label="Idioma origen" :value="result.source_language || 'auto'" icon="🔍"/>
        <MetadataChip label="Idioma destí"  :value="result.target_language || '—'"   icon="🌍"/>
        <MetadataChip label="Estat"          :value="result.status"                   icon="✅"/>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap gap-3 justify-center">
        <RouterLink to="/camera" class="btn-primary">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          </svg>
          Escanejar un altre menú
        </RouterLink>
        <RouterLink to="/profile" class="btn-secondary">
          Editar preferències
        </RouterLink>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink }   from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import axios from 'axios';

// ── Inline MetadataChip sub-component ─────────────────────────────────────
const MetadataChip = {
  props: ['label', 'value', 'icon'],
  template: `
    <div class="card py-3 px-4 flex items-center gap-3 text-sm">
      <span class="text-2xl">{{ icon }}</span>
      <div>
        <p class="text-gray-500 text-xs">{{ label }}</p>
        <p class="text-white font-medium uppercase tracking-wide">{{ value }}</p>
      </div>
    </div>
  `,
};

const API_BASE  = import.meta.env.VITE_API_BASE_URL || '/api';
const userStore = useUserStore();

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps({
  historyId: { type: String, required: true },
});

// ── State ──────────────────────────────────────────────────────────────────
const result     = ref(null);
const isLoading  = ref(true);
const fetchError = ref(null);
const copied     = ref(false);

// ── Computed ───────────────────────────────────────────────────────────────
const LANG_NAMES = {
  ca: 'Català', es: 'Espanyol', en: 'English', fr: 'Français',
  de: 'Deutsch', it: 'Italiano', pt: 'Português', ja: '日本語', zh: '中文', ar: 'العربية',
};

const languageLabel = computed(() =>
  LANG_NAMES[result.value?.target_language] || result.value?.target_language || '—'
);

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(fetchResult);

// ── Actions ────────────────────────────────────────────────────────────────
async function fetchResult() {
  isLoading.value  = true;
  fetchError.value = null;
  try {
    const { data } = await axios.get(`${API_BASE}/analysis/${props.historyId}`);
    result.value = data;
  } catch (err) {
    fetchError.value = err.response?.data?.message || err.message;
  } finally {
    isLoading.value = false;
  }
}

async function copyText() {
  if (!result.value?.translated_text) return;
  try {
    await navigator.clipboard.writeText(result.value.translated_text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2500);
  } catch {
    // Fallback: textarea trick
    const el = document.createElement('textarea');
    el.value = result.value.translated_text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2500);
  }
}
</script>
