import express from 'express';
import { publicShare } from '../controllers/shareLinkController.js';
import { acceptQuotation, rejectQuotation } from '../controllers/quotationController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/share/:token', publicShare);
router.post('/quotations/:token/accept', acceptQuotation);
router.post('/quotations/:token/reject', rejectQuotation);

export default router;


