<template>
  <section class="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
    <!-- Header -->
    <div class="mb-10 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                  bg-gradient-to-br from-brand-400 to-brand-700
                  shadow-xl shadow-brand-500/30 mb-5">
        <svg class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-white mb-2">El meu Perfil</h1>
      <p class="text-gray-400">Configura el teu idioma i restriccions alimentàries per rebre recomanacions personalitzades.</p>
    </div>

    <!-- Form card -->
    <div class="card space-y-8">
      <!-- Language selector -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-3">
          🌍 Idioma natiu
        </label>
        <select id="native-language" v-model="form.native_language" class="input-field">
          <option v-for="lang in LANGUAGES" :key="lang.code" :value="lang.code">
            {{ lang.flag }} {{ lang.name }}
          </option>
        </select>
      </div>

      <!-- Dietary restrictions -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-3">
          🥗 Restriccions alimentàries
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label
            v-for="item in DIETARY_OPTIONS"
            :key="item.value"
            :for="`diet-${item.value}`"
            class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200"
            :class="form.dietary_restrictions.includes(item.value)
              ? 'border-brand-500/60 bg-brand-500/10 text-brand-300'
              : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'"
          >
            <input
              :id="`diet-${item.value}`"
              v-model="form.dietary_restrictions"
              type="checkbox"
              :value="item.value"
              class="accent-brand-500 w-4 h-4"
            />
            <span class="text-sm font-medium">{{ item.icon }} {{ item.label }}</span>
          </label>
        </div>
      </div>

      <!-- Allergies -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-3">
          ⚠️ Al·lèrgies
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label
            v-for="item in ALLERGY_OPTIONS"
            :key="item.value"
            :for="`allergy-${item.value}`"
            class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200"
            :class="form.allergies.includes(item.value)
              ? 'border-red-500/60 bg-red-500/10 text-red-300'
              : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'"
          >
            <input
              :id="`allergy-${item.value}`"
              v-model="form.allergies"
              type="checkbox"
              :value="item.value"
              class="accent-red-500 w-4 h-4"
            />
            <span class="text-sm font-medium">{{ item.icon }} {{ item.label }}</span>
          </label>
        </div>
      </div>

      <!-- Extra notes -->
      <div>
        <label for="extra-notes" class="block text-sm font-medium text-gray-300 mb-3">
          📝 Notes addicionals (opcional)
        </label>
        <textarea
          id="extra-notes"
          v-model="form.extra_notes"
          rows="3"
          placeholder="Ex: Sóc vegà estricte, prefereixo plats lleugers..."
          class="input-field resize-none"
        />
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-4 pt-2">
        <button
          id="save-profile-btn"
          :disabled="isSaving"
          class="btn-primary flex-1"
          @click="handleSave"
        >
          <svg v-if="isSaving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 13l4 4L19 7"/>
          </svg>
          {{ isSaving ? 'Desant...' : 'Desar perfil' }}
        </button>
        <RouterLink to="/camera" class="btn-secondary">
          Escanejar menú →
        </RouterLink>
      </div>

      <!-- Success / Error banner -->
      <Transition name="fade">
        <div v-if="saveStatus === 'success'"
             class="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Perfil desat correctament!
        </div>
        <div v-else-if="saveStatus === 'error'"
             class="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Error en desar el perfil. Torna-ho a intentar.
        </div>
      </Transition>
    </div>

    <!-- Active badges summary -->
    <div v-if="activeBadges.length" class="mt-6 card">
      <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Restriccions actives</p>
      <div class="flex flex-wrap gap-2">
        <span v-for="b in activeBadges" :key="b" class="badge-danger">
          ⚠️ {{ b }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { RouterLink }   from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

// ── Constants ──────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'ca', name: 'Català',    flag: '🏳️' },
  { code: 'es', name: 'Espanyol',  flag: '🇪🇸' },
  { code: 'en', name: 'English',   flag: '🇬🇧' },
  { code: 'fr', name: 'Français',  flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch',   flag: '🇩🇪' },
  { code: 'it', name: 'Italiano',  flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語',    flag: '🇯🇵' },
  { code: 'zh', name: '中文',      flag: '🇨🇳' },
  { code: 'ar', name: 'العربية',   flag: '🇸🇦' },
];

const DIETARY_OPTIONS = [
  { value: 'gluten',    label: 'Gluten free',  icon: '🌾' },
  { value: 'lactose',   label: 'Sense lactosa', icon: '🥛' },
  { value: 'vegan',     label: 'Vegà',          icon: '🌿' },
  { value: 'vegetarian',label: 'Vegetarià',     icon: '🥕' },
  { value: 'halal',     label: 'Halal',         icon: '☪️' },
  { value: 'kosher',    label: 'Kosher',        icon: '✡️' },
];

const ALLERGY_OPTIONS = [
  { value: 'peanuts',   label: 'Cacauets',   icon: '🥜' },
  { value: 'nuts',      label: 'Fruits secs', icon: '🌰' },
  { value: 'shellfish', label: 'Marisc',     icon: '🦐' },
  { value: 'fish',      label: 'Peix',       icon: '🐟' },
  { value: 'eggs',      label: 'Ous',        icon: '🥚' },
  { value: 'soy',       label: 'Soja',       icon: '🌱' },
];

// ── State ──────────────────────────────────────────────────────────────────
const form = reactive({
  native_language:      'ca',
  dietary_restrictions: [],
  allergies:            [],
  extra_notes:          '',
});

const isSaving   = ref(false);
const saveStatus = ref(null); // null | 'success' | 'error'

// ── Computed ───────────────────────────────────────────────────────────────
const activeBadges = computed(() => [
  ...form.dietary_restrictions,
  ...form.allergies,
]);

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => populateForm());

watch(() => userStore.profile, () => populateForm());

function populateForm() {
  const p = userStore.profile;
  if (!p) return;
  form.native_language      = p.native_language      || 'ca';
  form.dietary_restrictions = p.dietary_restrictions || [];
  form.allergies            = p.allergies            || [];
  form.extra_notes          = p.extra_notes          || '';
}

// ── Actions ────────────────────────────────────────────────────────────────
async function handleSave() {
  isSaving.value   = true;
  saveStatus.value = null;
  try {
    await userStore.saveProfile({ ...form });
    saveStatus.value = 'success';
    setTimeout(() => (saveStatus.value = null), 4000);
  } catch {
    saveStatus.value = 'error';
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
