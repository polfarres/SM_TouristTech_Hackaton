<template>
  <!-- Hero section -->
  <section class="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
    <!-- Background gradient mesh -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl"/>
      <div class="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent-500/15 blur-3xl"/>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,165,233,0.05)_0%,_transparent_70%)]"/>
    </div>

    <div class="relative z-10 text-center max-w-3xl mx-auto animate-fade-in">
      <!-- Logo -->
      <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl
                  bg-gradient-to-br from-brand-400 to-brand-700
                  shadow-2xl shadow-brand-500/40 mb-8">
        <svg class="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </div>

      <h1 class="text-5xl sm:text-6xl font-extrabold text-white mb-5 leading-tight">
        Tourist<span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">Tech</span>
      </h1>
      <p class="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
        El teu assistent de viatge intel·ligent. Escaneja qualsevol menú i rep recomanacions personalitzades, traduïdes al teu idioma, en veu alta.
      </p>

      <!-- CTA buttons -->
      <div class="flex flex-wrap gap-4 justify-center mb-16">
        <RouterLink to="/camera" id="cta-scan" class="btn-primary text-base px-8 py-4">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          </svg>
          Escanejar menú ara
        </RouterLink>
        <RouterLink to="/profile" id="cta-profile" class="btn-secondary text-base px-8 py-4">
          Configurar perfil
        </RouterLink>
      </div>

      <!-- Feature pills -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <FeatureCard
          icon="👁️"
          title="OCR Visual"
          description="Cloud Vision API extreu el text de qualsevol menú o cartell amb alta precisió."
        />
        <FeatureCard
          icon="🤖"
          title="IA Gastronòmica"
          description="Gemini AI filtra els plats segons les teves al·lèrgies i et recomana les opcions segures."
        />
        <FeatureCard
          icon="🔊"
          title="Veu i Traducció"
          description="El resultat es tradueix al teu idioma i s'escolta gràcies a Text-to-Speech."
        />
      </div>
    </div>

    <!-- Powered by badge -->
    <div class="absolute bottom-8 flex items-center gap-2 text-xs text-gray-600">
      <span>Powered by</span>
      <span class="font-semibold text-gray-500">Google Cloud Platform</span>
      <span>·</span>
      <span class="font-semibold text-gray-500">Vertex AI (Gemini)</span>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';

const FeatureCard = {
  props: ['icon', 'title', 'description'],
  template: `
    <div class="card hover:border-gray-700 hover:-translate-y-1 transition-all duration-300 cursor-default">
      <div class="text-3xl mb-3">{{ icon }}</div>
      <h3 class="text-white font-semibold mb-1">{{ title }}</h3>
      <p class="text-gray-500 text-sm leading-relaxed">{{ description }}</p>
    </div>
  `,
};
</script>
