import { Router } from "express";
import { getVideos, getVideo, uploadVideo, deleteVideo, getCaptionsList } from "../controllers/videos.controller.js";

const router = Router();

router.get("/", getVideos);
router.get("/captions-list", getCaptionsList);
router.get("/:id", getVideo);
router.post("/", uploadVideo);
router.delete("/:id", deleteVideo);

export default router;
