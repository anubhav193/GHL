import { reactive, readonly } from 'vue';
import type { User } from '@/api/client';
import { getCurrentUser, logout as apiLogout } from '@/api/client';

interface AuthState {
  currentUser: User | null;
  isLoadingUser: boolean;
  hasLoadedOnce: boolean;
}

const state = reactive<AuthState>({
  currentUser: null,
  isLoadingUser: false,
  hasLoadedOnce: false,
});

async function fetchCurrentUser() {
  if (state.isLoadingUser) return;

  state.isLoadingUser = true;
  try {
    const { user } = await getCurrentUser();
    state.currentUser = user;
  } catch {
    state.currentUser = null;
  } finally {
    state.isLoadingUser = false;
    state.hasLoadedOnce = true;
  }
}

function setUser(user: User | null) {
  state.currentUser = user;
  if (!state.hasLoadedOnce) {
    state.hasLoadedOnce = true;
  }
}

async function logout() {
  try {
    await apiLogout();
  } finally {
    state.currentUser = null;
  }
}

export function useAuth() {
  return {
    state: readonly(state),
    fetchCurrentUser,
    setUser,
    logout,
  };
}

