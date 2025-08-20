import { Router } from "express";
import { getVideos, getVideo, createVideo, deleteVideo, getCaptionsList, getVideoURL, getVideoThumbnailURL } from "../controllers/videos.controller.js";

const router = Router();

router.get("/", getVideos);
router.get("/captions-list", getCaptionsList);
router.get("/:id", getVideo);
router.get("/:id/url", getVideoURL);
router.get("/:id/thumbnail", getVideoThumbnailURL);
router.post("/", createVideo);
router.delete("/:id", deleteVideo);

export default router;
