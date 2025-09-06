import { Router } from 'express';
import {
  getVideos,
  getVideo,
  createVideo,
  deleteVideo,
  getCaptionsList,
  getVideoURL,
  getVideoThumbnailURL,
  getVideosByGenre,
  updatevideo
} from '../controllers/videos.controller.js';

const router = Router();

router.get('/', getVideos);
router.get('/captions-list', getCaptionsList);
router.get('/:genre', getVideosByGenre);
router.get('/:id', getVideo);
router.get('/:id/url', getVideoURL);
router.get('/:id/thumbnail', getVideoThumbnailURL);
router.post('/', createVideo);
router.delete('/:id', deleteVideo);
router.put('/', updatevideo);

export default router;
