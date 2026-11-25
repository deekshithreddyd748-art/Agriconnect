import express from 'express';
import { respondToApplicationById } from '../controllers/labourRequestController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('farmer', 'admin'));

router.patch('/:id/accept', (req, res, next) => {
  req.body = { ...(req.body || {}), status: 'Accepted' };
  return respondToApplicationById(req, res, next);
});

router.patch('/:id/reject', (req, res, next) => {
  req.body = { ...(req.body || {}), status: 'Rejected' };
  return respondToApplicationById(req, res, next);
});

export default router;
