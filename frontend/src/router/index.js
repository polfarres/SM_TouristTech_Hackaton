import { createRouter, createWebHistory } from 'vue-router';
import ProfileView      from '@/views/ProfileView.vue';
import CameraView       from '@/views/CameraView.vue';
import ResultView       from '@/views/ResultView.vue';
import HomeView         from '@/views/HomeView.vue';

const routes = [
  { path: '/',        name: 'home',    component: HomeView },
  { path: '/profile', name: 'profile', component: ProfileView },
  { path: '/camera',  name: 'camera',  component: CameraView },
  {
    path: '/result/:historyId',
    name: 'result',
    component: ResultView,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
