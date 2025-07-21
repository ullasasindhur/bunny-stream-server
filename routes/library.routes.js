import { Router } from "express";
const router = Router();
import { getLibrary, getLibraryItem, createLibrary, getReplicationRegions, deleteLibrary } from "../controllers/library.controller.js";

router.get("/replication-regions", getReplicationRegions);
router.get("/", getLibrary);
router.get("/:id", getLibraryItem);
router.delete("/:id", deleteLibrary);
router.post("/", createLibrary);

export default router;