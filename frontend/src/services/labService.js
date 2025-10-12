import api from './api';

const labService = {
  // Start a lab session
  startLab: async () => {
    const response = await api.post('/labs/start');
    return response.data;
  },

  // Get active session
  getMySessions: async () => {
    const response = await api.get('/labs/my-session');
    return response.data ? [response.data] : [];
  },

  // Stop lab session
  stopLab: async () => {
    const response = await api.post('/labs/stop');
    return response.data;
  },
};

export default labService;