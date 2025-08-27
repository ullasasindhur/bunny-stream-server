import { Router } from "express";
const router = Router();
import { getLibraries, getLibrary, createLibrary, getReplicationRegions, deleteLibrary } from "../controllers/libraries.controller.js";

router.get("/replication-regions", getReplicationRegions);
router.get("/", getLibraries);
router.get("/:id", getLibrary);
router.delete("/:id", deleteLibrary);
router.post("/", createLibrary);

export default router;