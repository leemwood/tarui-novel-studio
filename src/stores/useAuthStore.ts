import { create } from 'zustand';

const API_BASE = '/api';

interface AuthStore {
  token: string | null;
  initialized: boolean | null;
  loading: boolean;

  checkHealth: () => Promise<void>;
  setup: (password: string) => Promise<void>;
  login: (password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
}

async function api(path: string, options?: RequestInit): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...options?.headers } });
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: localStorage.getItem('token'),
  initialized: null,
  loading: false,

  checkHealth: async () => {
    try {
      const res = await api('/health');
      const data = await res.json();
      set({ initialized: data.initialized });
    } catch {
      set({ initialized: false });
    }
  },

  setup: async (password) => {
    set({ loading: true });
    try {
      const res = await api('/setup', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'setup failed');
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      set({ token: data.token, initialized: true, loading: false });
    } catch (e: any) {
      set({ loading: false });
      throw e;
    }
  },

  login: async (password) => {
    set({ loading: true });
    try {
      const res = await api('/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'login failed');
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      set({ token: data.token, loading: false });
    } catch (e: any) {
      set({ loading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null });
  },

  getToken: () => get().token,
}));

// Named export for use in stores
export { api };
