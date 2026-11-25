import express from 'express';
import {
  deleteListingAdmin,
  deleteUser,
  getAdminOverview,
  getAllListingsAdmin,
  getAllUsers,
  toggleListingAvailabilityAdmin,
  toggleUserStatus,
} from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/overview', getAdminOverview);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/listings', getAllListingsAdmin);
router.patch('/listings/:type/:id/toggle', toggleListingAvailabilityAdmin);
router.delete('/listings/:type/:id', deleteListingAdmin);

export default router;
