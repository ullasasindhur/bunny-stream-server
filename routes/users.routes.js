import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { getUserMetadata, setVideoProgress, searchUsers, setRole } from '../controllers/users.controller.js';

const router = Router();

router.get('/search', authenticateToken, searchUsers);
router.get('/metadata', authenticateToken, getUserMetadata);
router.post('/videoProgress', authenticateToken, setVideoProgress);
router.patch('/setRole', authenticateToken, setRole);

export default router;
