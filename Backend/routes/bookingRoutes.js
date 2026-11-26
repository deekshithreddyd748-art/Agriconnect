import express from 'express';
import { body } from 'express-validator';
import {
  cancelBooking,
  createBooking,
  getBookingById,
  getMyBookings,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyBookings);
router.get('/:id', getBookingById);

router.post(
  '/',
  authorize('farmer', 'admin'),
  [
    body('serviceType')
      .optional()
      .isIn(['equipment', 'labour', 'facility'])
      .withMessage('Valid serviceType is required'),
    body('bookingDate').optional().trim(),
  ],
  validateRequest,
  createBooking
);

router.patch(
  '/:id/status',
  [
    body('status')
      .isIn(['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'])
      .withMessage('Invalid booking status'),
  ],
  validateRequest,
  updateBookingStatus
);

router.patch('/:id/cancel', cancelBooking);

export default router;
