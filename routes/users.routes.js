import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { getUserMetadata, setVideoProgress } from '../controllers/users.controller.js';

const router = Router();

router.get('/metadata', authenticateToken, getUserMetadata);
router.post('/videoProgress', authenticateToken, setVideoProgress);

export default router;
