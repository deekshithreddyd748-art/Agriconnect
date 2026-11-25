import express from 'express';
import { getMe, updateProfile } from '../controllers/authController.js';
import { getLabourRequests } from '../controllers/labourRequestController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('farmer', 'admin'));

router.get('/profile', getMe);
router.put('/profile', updateProfile);
router.get('/labour-requests', (req, res, next) => {
  req.query.mine = 'true';
  return getLabourRequests(req, res, next);
});

export default router;
