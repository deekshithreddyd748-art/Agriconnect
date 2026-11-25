import express from 'express';
import { body } from 'express-validator';
import {
  applyToLabourRequest,
  cancelLabourRequest,
  createLabourRequest,
  getLabourRequestById,
  getLabourRequests,
  getMyApplications,
  respondToApplication,
  updateLabourRequestStatus,
} from '../controllers/labourRequestController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/worker/my-applications', getMyApplications);
router.get('/', getLabourRequests);
router.get('/:id', getLabourRequestById);

router.post(
  '/',
  authorize('farmer', 'admin'),
  [
    body('category').trim().notEmpty().withMessage('Labour category is required'),
    body('workersRequired')
      .isInt({ min: 1 })
      .withMessage('Workers required must be a positive whole number'),
    body('startDate').trim().notEmpty().withMessage('Start date is required'),
    body('durationDays')
      .isFloat({ gt: 0 })
      .withMessage('Duration must be greater than 0'),
    body('dailyWage')
      .isFloat({ gt: 0 })
      .withMessage('Daily wage must be greater than 0'),
  ],
  validateRequest,
  createLabourRequest
);

router.patch('/:id/cancel', authorize('farmer', 'admin'), cancelLabourRequest);
router.patch('/:id/status', authorize('farmer', 'admin'), updateLabourRequestStatus);

router.post(
  '/:id/apply',
  authorize('labour_provider', 'admin'),
  applyToLabourRequest
);

router.patch(
  '/:id/applications/:appId',
  authorize('farmer', 'admin'),
  respondToApplication
);

export default router;
