import express from 'express';
import {
  getReceptions,
  saveLinks,
  uploadReceptions,
} from '../controllers/reception';
import { protectRoute } from '../controllers/auth';

const router = express.Router();

router.route('/reception').post(protectRoute, uploadReceptions);
router.route('/reception/:id').get(getReceptions);
router.route('/savelinks').post(protectRoute, saveLinks);

export default router;
