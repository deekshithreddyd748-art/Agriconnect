import express from 'express';
import { body } from 'express-validator';
import {
  completeOtpOnboarding,
  getMe,
  login,
  register,
  sendOtp,
  updateProfile,
  verifyOtp,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Mobile number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

router.post(
  '/otp/send',
  [body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required')],
  validateRequest,
  sendOtp
);

router.post(
  '/otp/verify',
  [
    body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required'),
    body('otp').trim().notEmpty().withMessage('OTP is required'),
  ],
  validateRequest,
  verifyOtp
);

router.post(
  '/otp/complete',
  [
    body('verificationToken').notEmpty().withMessage('Verification token is required'),
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('village').trim().notEmpty().withMessage('Village is required'),
    body('district').trim().notEmpty().withMessage('District is required'),
  ],
  validateRequest,
  completeOtpOnboarding
);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
