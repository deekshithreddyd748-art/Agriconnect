import express from 'express';
import {
  getDashboardStats,
  getNearbyServices,
  getPublicStats,
  reportListing,
} from '../controllers/discoveryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/public-stats', getPublicStats);
router.get('/nearby', getNearbyServices);
router.get('/dashboard', protect, getDashboardStats);
router.post('/report/:type/:id', protect, reportListing);

export default router;
