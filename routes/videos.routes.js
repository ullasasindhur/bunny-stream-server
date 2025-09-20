import { Router } from 'express';
import {
  getVideos,
  getVideo,
  createVideo,
  deleteVideo,
  getCaptionsList,
  getVideosByGenre,
  updatevideo,
  globalSearch
} from '../controllers/videos.controller.js';

const router = Router();

router.get('/', getVideos);
router.get('/search', globalSearch);
router.get('/captions-list', getCaptionsList);
router.get('/genre', getVideosByGenre);
router.get('/:id', getVideo);
router.post('/', createVideo);
router.delete('/:id', deleteVideo);
router.patch('/:id', updatevideo);

export default router;
