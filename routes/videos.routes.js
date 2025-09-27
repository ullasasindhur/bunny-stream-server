import { Router } from 'express';
import {
  getVideos,
  getVideo,
  createVideo,
  deleteVideo,
  getCaptionsList,
  getVideosByGenre,
  updatevideo,
  globalSearch,
  updateStats
} from '../controllers/videos.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticateToken, getVideos);
router.get('/search', authenticateToken, globalSearch);
router.get('/captions-list', authenticateToken, getCaptionsList);
router.get('/genre/:genre', authenticateToken, getVideosByGenre);
router.get('/:id', authenticateToken, getVideo);
router.post('/', authenticateToken, createVideo);
router.delete('/:id', authenticateToken, deleteVideo);
router.patch('/:id', authenticateToken, updatevideo);
router.patch('/stats/:id', authenticateToken, updateStats);

export default router;
