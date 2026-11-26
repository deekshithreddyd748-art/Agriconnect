import express from 'express';
import {
  continueProfile,
  selectProfileRole,
} from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/continue', continueProfile);
router.patch('/:id/role', protect, selectProfileRole);

export default router;
