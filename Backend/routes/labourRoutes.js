import express from 'express';
import { body } from 'express-validator';
import {
  createLabour,
  deleteLabour,
  getLabourById,
  getLabours,
  updateLabour,
} from '../controllers/labourController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.get('/', getLabours);
router.get('/:id', getLabourById);

router.post(
  '/',
  protect,
  authorize('labour_provider', 'admin'),
  [
    body('category').trim().notEmpty().withMessage('Labour category is required'),
    body('workersAvailable')
      .optional()
      .isInt({ min: 1 })
      .withMessage('At least 1 available worker is required'),
  ],
  validateRequest,
  createLabour
);

router.put(
  '/:id',
  protect,
  authorize('labour_provider', 'admin'),
  updateLabour
);

router.patch(
  '/:id',
  protect,
  authorize('labour_provider', 'admin'),
  updateLabour
);

router.delete(
  '/:id',
  protect,
  authorize('labour_provider', 'admin'),
  deleteLabour
);

export default router;
