import express from 'express';
import {
  getLabTemplates,
  startLab,
  getMySessions,
  stopLab,
} from '../controllers/labController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all available lab templates
router.get('/templates', getLabTemplates);

// Start a new lab session
router.post('/start', startLab);

// Get student's active sessions
router.get('/my-sessions', getMySessions);

// Stop a specific lab session
router.post('/:sessionId/stop', stopLab);

export default router;