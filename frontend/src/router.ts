import { createRouter, createWebHistory } from 'vue-router';
import TestView from './views/TestView.vue';

const routes = [
  {
    path: '/test',
    name: 'test',
    component: TestView,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

