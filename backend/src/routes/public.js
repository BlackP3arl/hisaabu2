import express from 'express';
import { publicShare } from '../controllers/shareLinkController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/share/:token', publicShare);

export default router;


