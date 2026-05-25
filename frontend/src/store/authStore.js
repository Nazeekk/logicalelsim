import { create } from 'zustand';
import api from '../api/axios';
import * as Sentry from '@sentry/react';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  error: null,
  isLoading: false,

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { email, password });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      Sentry.setUser({
        id: user.id,
        email: user.email,
        segment: 'premium_developer',
      });
      Sentry.setTag('user_group', 'PP-32');

      set({ user, token, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    Sentry.setUser(null);

    set({ user: null, token: null });
  },
}));
