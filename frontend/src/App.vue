<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Navigation bar -->
    <nav class="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
      <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-3 group">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600
                      flex items-center justify-center shadow-lg shadow-brand-500/30
                      group-hover:scale-110 transition-transform duration-200">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <span class="font-bold text-white text-lg">TouristTech</span>
        </RouterLink>

        <!-- Nav links -->
        <div class="flex items-center gap-1">
          <NavLink to="/"        icon="home">Inici</NavLink>
          <NavLink to="/camera"  icon="camera">Escanejar</NavLink>
          <NavLink to="/profile" icon="user">Perfil</NavLink>
        </div>
      </div>
    </nav>

    <!-- Page content -->
    <main class="pt-16 min-h-screen">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { onMounted }    from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import NavLink          from '@/components/NavLink.vue';

const userStore = useUserStore();

onMounted(async () => {
  // Initialize demo user for the hackathon
  if (!userStore.isLoggedIn) {
    userStore.initDemoUser();
  }
  await userStore.fetchProfile();
});
</script>

<style scoped>
/* Page transition */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
