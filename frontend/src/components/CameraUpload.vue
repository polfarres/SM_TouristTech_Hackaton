<template>
  <section class="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
    <!-- Header -->
    <div class="mb-10 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                  bg-gradient-to-br from-accent-400 to-accent-600
                  shadow-xl shadow-accent-500/30 mb-5">
        <svg class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-white mb-2">Escanejar Menú</h1>
      <p class="text-gray-400">Fes una foto a un menú o cartell per obtenir recomanacions personalitzades a l'instant.</p>
    </div>

    <!-- Camera / upload area -->
    <div class="card space-y-6">

      <!-- Viewfinder / Preview -->
      <div
        class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed
               bg-gray-800/60 flex items-center justify-center transition-all duration-300"
        :class="previewUrl ? 'border-brand-500/50' : 'border-gray-700 hover:border-gray-500'"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
      >
        <!-- Live camera stream -->
        <video
          v-if="cameraActive && !previewUrl"
          ref="videoEl"
          autoplay
          playsinline
          muted
          class="w-full h-full object-cover"
        />

        <!-- Captured / uploaded preview -->
        <img
          v-else-if="previewUrl"
          :src="previewUrl"
          alt="Previsualització de la imatge capturada"
          class="w-full h-full object-contain"
        />

        <!-- Idle placeholder -->
        <div v-else class="flex flex-col items-center gap-4 text-center px-8">
          <div class="w-20 h-20 rounded-full bg-gray-700/50 flex items-center justify-center">
            <svg class="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-gray-400 font-medium">Activa la càmera o puja una imatge</p>
            <p class="text-gray-600 text-sm mt-1">Arrossega aquí o fes clic al botó</p>
          </div>
        </div>

        <!-- Scanning overlay animation -->
        <div v-if="uploading || processing" class="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center gap-4">
          <div class="w-14 h-14 rounded-full border-4 border-brand-500/30 border-t-brand-500 animate-spin"/>
          <p class="text-brand-300 font-medium text-sm animate-pulse-slow">{{ statusMessage }}</p>
        </div>

        <!-- Canvas (hidden, used for capturing frame) -->
        <canvas ref="canvasEl" class="hidden"/>
      </div>

      <!-- Controls -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Start / stop camera -->
        <button
          id="toggle-camera-btn"
          class="btn-secondary justify-center"
          :disabled="!!previewUrl || uploading"
          @click="toggleCamera"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          {{ cameraActive ? 'Atura càmera' : 'Activar càmera' }}
        </button>

        <!-- Capture button (active when camera on) -->
        <button
          v-if="cameraActive && !previewUrl"
          id="capture-photo-btn"
          class="btn-primary justify-center"
          @click="capturePhoto"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          </svg>
          Capturar foto
        </button>

        <!-- Upload file (when camera is off) -->
        <label
          v-else-if="!previewUrl"
          for="file-upload-input"
          class="btn-primary justify-center cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Pujar imatge
          <input id="file-upload-input" type="file" accept="image/*" class="hidden" @change="handleFileSelect"/>
        </label>

        <!-- Retake -->
        <button
          v-if="previewUrl"
          id="retake-btn"
          class="btn-secondary justify-center col-span-1"
          @click="resetCapture"
        >
          ↩ Repetir
        </button>

        <!-- Analyze -->
        <button
          v-if="previewUrl && !uploading"
          id="analyze-btn"
          class="btn-primary justify-center col-span-1"
          @click="uploadAndAnalyze"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          Analitzar menú
        </button>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        ⚠️ {{ errorMsg }}
      </div>

      <!-- Tips -->
      <div class="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
        <p class="text-xs text-brand-400 font-semibold mb-2 uppercase tracking-wider">Consells per millors resultats</p>
        <ul class="text-xs text-gray-500 space-y-1">
          <li>📸 Assegura't que el text del menú sigui llegible i ben il·luminat.</li>
          <li>📐 Fes la foto de forma perpendicular al menú, sense angles excessius.</li>
          <li>🔍 Inclou tot el text del menú en una sola imatge si és possible.</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useRouter }   from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import axios from 'axios';

const API_BASE  = import.meta.env.VITE_API_BASE_URL || '/api';
const router    = useRouter();
const userStore = useUserStore();

// ── Template refs ──────────────────────────────────────────────────────────
const videoEl  = ref(null);
const canvasEl = ref(null);

// ── State ──────────────────────────────────────────────────────────────────
const cameraActive = ref(false);
const previewUrl   = ref(null);  // DataURL or object URL of the captured image
const capturedBlob = ref(null);  // Blob to upload
const uploading    = ref(false);
const processing   = ref(false);
const errorMsg     = ref(null);
let   mediaStream  = null;

const statusMessage = computed(() => {
  if (uploading.value) return 'Pujant imatge a Cloud Storage...';
  if (processing.value) return 'Analitzant amb IA... Un moment!';
  return '';
});

// ── Camera controls ────────────────────────────────────────────────────────
async function toggleCamera() {
  if (cameraActive.value) {
    stopCamera();
  } else {
    await startCamera();
  }
}

async function startCamera() {
  errorMsg.value = null;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
    });
    cameraActive.value = true;
    // Wait for Vue to render the <video> element
    await nextTick();
    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream;
    }
  } catch (err) {
    errorMsg.value = `No s'ha pogut accedir a la càmera: ${err.message}`;
  }
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  cameraActive.value = false;
}

function capturePhoto() {
  if (!videoEl.value || !canvasEl.value) return;
  const video  = videoEl.value;
  const canvas = canvasEl.value;
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    capturedBlob.value = blob;
    previewUrl.value   = URL.createObjectURL(blob);
    stopCamera();
  }, 'image/jpeg', 0.92);
}

// ── File upload via input / drag-drop ─────────────────────────────────────
function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (file) setFile(file);
}

function handleFileDrop(event) {
  const file = event.dataTransfer.files?.[0];
  if (file && file.type.startsWith('image/')) setFile(file);
}

function setFile(file) {
  capturedBlob.value = file;
  previewUrl.value   = URL.createObjectURL(file);
}

function resetCapture() {
  previewUrl.value   = null;
  capturedBlob.value = null;
  errorMsg.value     = null;
}

// ── Upload to Cloud Storage & trigger analysis ─────────────────────────────
async function uploadAndAnalyze() {
  if (!capturedBlob.value || !userStore.userId) return;
  errorMsg.value = null;
  uploading.value = true;

  try {
    // 1. Request a signed upload URL from our backend
    const { data: signedData } = await axios.post(`${API_BASE}/upload/signed-url`, {
      userId:      userStore.userId,
      contentType: capturedBlob.value.type || 'image/jpeg',
    });

    // 2. PUT the image directly to Cloud Storage via the signed URL
    await axios.put(signedData.uploadUrl, capturedBlob.value, {
      headers: { 'Content-Type': capturedBlob.value.type || 'image/jpeg' },
    });

    uploading.value  = false;
    processing.value = true;

    // 3. Poll the analysis_history row until status = 'done'
    const historyId = signedData.historyId;
    await pollForResult(historyId);

  } catch (err) {
    errorMsg.value  = `Error durant l'anàlisi: ${err.response?.data?.message || err.message}`;
    uploading.value  = false;
    processing.value = false;
  }
}

async function pollForResult(historyId, maxAttempts = 30, intervalMs = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    try {
      const { data } = await axios.get(`${API_BASE}/analysis/${historyId}`);
      if (data.status === 'done') {
        processing.value = false;
        router.push({ name: 'result', params: { historyId } });
        return;
      }
      if (data.status === 'error') {
        throw new Error(data.error_message || 'Error desconegut en el processament.');
      }
    } catch (pollErr) {
      if (i === maxAttempts - 1) throw pollErr;
    }
  }
  throw new Error('Temps d\'espera superat. Torna-ho a intentar.');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── nextTick polyfill for this file ────────────────────────────────────────
function nextTick() {
  return new Promise((r) => setTimeout(r, 0));
}

// ── Cleanup ────────────────────────────────────────────────────────────────
onUnmounted(() => {
  stopCamera();
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>
