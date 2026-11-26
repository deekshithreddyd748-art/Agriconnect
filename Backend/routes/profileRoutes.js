import express from 'express';
import {
  continueProfile,
  getProfileById,
  selectProfileRole,
  updateProfileById,
} from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';

const router = express.Router();

router.post('/continue', continueProfile);
router.get('/:id', getProfileById);
router.patch('/:id', protect, uploadImages.array('images', 1), updateProfileById);
router.patch('/:id/role', protect, selectProfileRole);

export default router;
