import express from 'express';
import { getStats } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/stats', getStats);

export default router;


