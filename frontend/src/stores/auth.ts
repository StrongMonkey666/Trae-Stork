import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface User {
  id: number;
  email: string;
  nickname?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password,
          });

          const { access_token, user } = response.data;

          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          set({
            user,
            token: access_token,
            isAuthenticated: true,
          });
        } catch (error) {
          throw error;
        }
      },

      register: async (email: string, password: string, nickname?: string) => {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            email,
            password,
            nickname,
          });

          set({
            user: response.data,
          });
        } catch (error) {
          throw error;
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization'];
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
