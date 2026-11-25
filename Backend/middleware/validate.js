import { validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

export function validateRequest(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((item) => item.msg)
      .join('. ');
    return next(new AppError(message, 400));
  }
  return next();
}
