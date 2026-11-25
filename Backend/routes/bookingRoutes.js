import express from 'express';
import { body } from 'express-validator';
import {
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
      .isIn(['equipment', 'labour', 'facility'])
      .withMessage('Valid serviceType is required'),
    body('serviceId').notEmpty().withMessage('serviceId is required'),
    body('bookingDate').trim().notEmpty().withMessage('Booking date is required'),
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

export default router;
