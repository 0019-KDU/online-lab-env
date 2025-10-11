import api from './api';

const labService = {
  // Get all lab templates
  getLabTemplates: async () => {
    const response = await api.get('/labs/templates');
    return response.data;
  },

  // Start a new lab session
  startLab: async (templateId) => {
    const response = await api.post('/labs/start', { templateId });
    return response.data;
  },

  // Get student's active sessions
  getMySessions: async () => {
    const response = await api.get('/labs/my-sessions');
    return response.data;
  },

  // Stop a lab session
  stopLab: async (sessionId) => {
    const response = await api.post(`/labs/${sessionId}/stop`);
    return response.data;
  },
};

export default labService;