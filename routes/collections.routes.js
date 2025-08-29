import { Router } from "express";
import { getCollections, getCollection, createCollection, updateCollection, deleteCollection } from "../controllers/collections.controller.js";

const router = Router();

router.get("/", getCollections);
router.get("/:id", getCollection);
router.post("/", createCollection);
router.put("/:id", updateCollection);
router.delete("/:id", deleteCollection);

export default router;