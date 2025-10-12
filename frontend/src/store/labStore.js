import { create } from 'zustand';
import labService from '../services/labService';

const useLabStore = create((set, get) => ({
  activeSessions: [],
  isLoading: false,
  error: null,

  // Fetch active sessions
  fetchActiveSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await labService.getMySessions();
      set({ activeSessions: sessions, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch sessions',
        isLoading: false 
      });
    }
  },

  // Start a new lab
  startLab: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await labService.startLab();
      set({ 
        activeSessions: [session],
        isLoading: false 
      });
      return session;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to start lab';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Stop the lab
  stopLab: async () => {
    set({ isLoading: true, error: null });
    try {
      await labService.stopLab();
      set({ 
        activeSessions: [],
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to stop lab',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useLabStore;