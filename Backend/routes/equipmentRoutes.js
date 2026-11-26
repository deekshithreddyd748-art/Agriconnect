import express from 'express';
import { body } from 'express-validator';
import {
  createEquipment,
  deleteEquipment,
  getEquipmentById,
  getEquipments,
  updateEquipment,
} from '../controllers/equipmentController.js';
import { authorize, protect } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.get('/', getEquipments);
router.get('/:id', getEquipmentById);

router.post(
  '/',
  protect,
  authorize('equipment_owner', 'admin'),
  uploadImages.array('images', 5),
  [
    body('name').optional().trim(),
    body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
  ],
  validateRequest,
  createEquipment
);

router.put(
  '/:id',
  protect,
  authorize('equipment_owner', 'admin'),
  uploadImages.array('images', 5),
  updateEquipment
);

router.patch(
  '/:id',
  protect,
  authorize('equipment_owner', 'admin'),
  uploadImages.array('images', 5),
  updateEquipment
);

router.delete(
  '/:id',
  protect,
  authorize('equipment_owner', 'admin'),
  deleteEquipment
);

export default router;
