import express from 'express';
import {
  acceptLabourRequest,
  applyToLabourRequest,
  cancelLabourRequest,
  createLabourRequest,
  getFarmerLabourBookings,
  getLabourRequestById,
  getLabourRequests,
  getMyApplications,
  getRequestApplications,
  getWorkerBookings,
  respondToApplication,
  updateLabourBookingStatus,
  updateLabourRequest,
  updateLabourRequestStatus,
} from '../controllers/labourRequestController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { body } from 'express-validator';

const router = express.Router();

router.use(protect);

router.get('/worker/my-applications', getMyApplications);
router.get('/worker/bookings', authorize('labour_provider', 'admin'), getWorkerBookings);
router.get('/farmer/bookings', authorize('farmer', 'admin'), getFarmerLabourBookings);
router.patch('/bookings/:bookingId/status', updateLabourBookingStatus);

router.get('/', getLabourRequests);
router.get('/:id', getLabourRequestById);
router.get('/:id/applications', authorize('farmer', 'admin'), getRequestApplications);

router.post(
  '/',
  authorize('farmer', 'admin'),
  [
    body('category').trim().notEmpty().withMessage('Work type is required'),
    body('workersRequired')
      .isInt({ min: 1 })
      .withMessage('Number of workers must be a positive whole number'),
    body('startDate').trim().notEmpty().withMessage('Required date is required'),
  ],
  validateRequest,
  createLabourRequest
);

router.put('/:id', authorize('farmer', 'admin'), updateLabourRequest);
router.patch('/:id/cancel', authorize('farmer', 'admin'), cancelLabourRequest);
router.patch('/:id/status', authorize('farmer', 'admin'), updateLabourRequestStatus);

router.post(
  '/:id/accept',
  authorize('labour_provider', 'admin'),
  acceptLabourRequest
);

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
