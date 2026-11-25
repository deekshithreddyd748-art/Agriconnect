import express from 'express';
import { body } from 'express-validator';
import {
  completeOtpOnboarding,
  getMe,
  getOtpStatus,
  login,
  logoutUser,
  register,
  sendOtp,
  updateProfile,
  verifyOtp,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { createIpRateLimiter } from '../middleware/rateLimit.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

const otpSendLimiter = createIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'Too many OTP requests from this IP address. Please wait before trying again.',
});

const otpVerifyLimiter = createIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many OTP verification attempts from this IP address. Please try again later.',
});

const sendOtpValidation = [
  body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required'),
];

const verifyOtpValidation = [
  body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required'),
  body('otp').trim().notEmpty().withMessage('OTP is required'),
];

const completeProfileValidation = [
  body('verificationToken').notEmpty().withMessage('Verification token is required'),
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('village').trim().notEmpty().withMessage('Village is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
];

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

router.get('/otp/status', getOtpStatus);

// Canonical & requested OTP endpoints
router.post('/otp/send', otpSendLimiter, sendOtpValidation, validateRequest, sendOtp);
router.post('/send-otp', otpSendLimiter, sendOtpValidation, validateRequest, sendOtp);

router.post('/otp/verify', otpVerifyLimiter, verifyOtpValidation, validateRequest, verifyOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyOtpValidation, validateRequest, verifyOtp);

router.post('/otp/complete', completeProfileValidation, validateRequest, completeOtpOnboarding);
router.post(
  '/complete-farmer-profile',
  completeProfileValidation,
  validateRequest,
  completeOtpOnboarding
);

router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
