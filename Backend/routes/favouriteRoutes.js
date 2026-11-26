import express from 'express';
import {
  addFavourite,
  getFavourites,
  removeFavourite,
} from '../controllers/favouriteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getFavourites);
router.post('/', addFavourite);
router.delete('/:id', removeFavourite);

export default router;
