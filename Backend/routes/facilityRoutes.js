import express from 'express';
import { body } from 'express-validator';
import {
  createFacility,
  deleteFacility,
  getFacilities,
  getFacilityById,
  updateFacility,
} from '../controllers/facilityController.js';
import { authorize, protect } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.get('/', getFacilities);
router.get('/:id', getFacilityById);

router.post(
  '/',
  protect,
  authorize('facility_operator', 'admin'),
  uploadImages.array('images', 5),
  [
    body('capacity').isFloat({ min: 1 }).withMessage('Valid total capacity is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid service charge is required'),
  ],
  validateRequest,
  createFacility
);

router.put(
  '/:id',
  protect,
  authorize('facility_operator', 'admin'),
  uploadImages.array('images', 5),
  updateFacility
);

router.patch(
  '/:id',
  protect,
  authorize('facility_operator', 'admin'),
  uploadImages.array('images', 5),
  updateFacility
);

router.delete(
  '/:id',
  protect,
  authorize('facility_operator', 'admin'),
  deleteFacility
);

export default router;
