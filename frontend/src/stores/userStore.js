import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

// Base URL for all API calls – adjust to your backend / Cloud Run URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const useUserStore = defineStore('user', () => {
  // ── State ──
  const userId      = ref(localStorage.getItem('tt_user_id') || null);
  const profile     = ref(null);
  const isLoading   = ref(false);
  const error       = ref(null);

  // ── Getters ──
  const isLoggedIn  = computed(() => !!userId.value);
  const language    = computed(() => profile.value?.native_language || 'ca');

  // ── Actions ──

  /**
   * Simulate a simple "login" for the hackathon demo.
   * In production, replace with Firebase Auth / Google Identity.
   */
  function initDemoUser(id = 'a1b2c3d4-0000-0000-0000-000000000001') {
    userId.value = id;
    localStorage.setItem('tt_user_id', id);
  }

  async function fetchProfile() {
    if (!userId.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await axios.get(`${API_BASE}/users/${userId.value}/profile`);
      profile.value = data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      console.error('[UserStore] fetchProfile error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function saveProfile(payload) {
    if (!userId.value) throw new Error('Not authenticated');
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await axios.put(`${API_BASE}/users/${userId.value}/profile`, payload);
      profile.value = data;
      return data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    userId, profile, isLoading, error,
    isLoggedIn, language,
    initDemoUser, fetchProfile, saveProfile,
  };
});
