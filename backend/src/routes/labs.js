import express from 'express';
import { startLab, getMySession, stopLab } from '../controllers/labController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/start', startLab);
router.get('/my-session', getMySession);
router.post('/stop', stopLab);

export default router;