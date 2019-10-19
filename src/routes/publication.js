import express from 'express';
import {
  deletePublication,
  searchPublications,
  editPublication,
  upload,
} from '../controllers/publication';
import { protectRoute } from '../controllers/auth';

const router = express.Router();

router
  .route('/publication')
  .get(searchPublications)
  .post(protectRoute, upload)
  .delete(protectRoute, deletePublication)
  .put(protectRoute, editPublication);

export default router;
