import { Router } from 'express';
import { addDetails, getDetails } from '../controllers/moderator.controller.js';

const router = Router();

router.get('/:id', getDetails);
router.post('/', addDetails);

export default router;
