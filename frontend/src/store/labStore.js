import { create } from 'zustand';
import labService from '../services/labService';

const useLabStore = create((set, get) => ({
  templates: [],
  activeSessions: [],
  isLoading: false,
  error: null,

  // Fetch lab templates
  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const templates = await labService.getLabTemplates();
      set({ templates, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch templates',
        isLoading: false 
      });
    }
  },

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
  startLab: async (templateId) => {
    set({ isLoading: true, error: null });
    try {
      const session = await labService.startLab(templateId);
      set({ 
        activeSessions: [...get().activeSessions, session],
        isLoading: false 
      });
      return session;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to start lab';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Stop a lab
  stopLab: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      await labService.stopLab(sessionId);
      set({ 
        activeSessions: get().activeSessions.filter(s => s._id !== sessionId),
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

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useLabStore;