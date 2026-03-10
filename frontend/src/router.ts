import { createRouter, createWebHistory } from 'vue-router';
import NProgress from 'nprogress';
import TestView from './views/TestView.vue';
import ComponentsPage from './views/ComponentsPage.vue';
import AgentStudioLanding from './views/AgentStudioLanding.vue';
import SignupView from './views/SignupView.vue';
import AppDummy from './views/AppDummy.vue';
import { useAuth } from './composables/useAuth';

const routes = [
  {
    path: '/',
    name: 'home',
    component: AgentStudioLanding,
  },
  {
    path: '/test',
    name: 'test',
    component: TestView,
  },
  {
    path: '/components',
    name: 'components',
    component: ComponentsPage,
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignupView,
    meta: {
      guestOnly: true,
    },
  },
  {
    path: '/app',
    name: 'app-root',
    redirect: '/app/dummy',
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/app/dummy',
    name: 'app-dummy',
    component: AppDummy,
    meta: {
      requiresAuth: true,
    },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

NProgress.configure({
  showSpinner: false,
});

router.beforeEach(async (to, _from, next) => {
  NProgress.start();

  const { state, fetchCurrentUser } = useAuth();

  if (!state.hasLoadedOnce && !state.isLoadingUser) {
    await fetchCurrentUser();
  }

  if (to.meta.requiresAuth && !state.currentUser) {
    next({
      path: '/',
      query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
    });
    NProgress.done();
    return;
  }

  if (to.meta.guestOnly && state.currentUser) {
    next({ path: '/app' });
    NProgress.done();
    return;
  }

  next();
});

router.afterEach(() => {
  NProgress.done();
});

router.onError(() => {
  NProgress.done();
});

