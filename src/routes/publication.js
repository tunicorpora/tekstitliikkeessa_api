import express from 'express';
import {
  deletePublication,
  searchPublications,
  editPublication,
  getPublication,
  upload,
  uploadSingle,
  batchDeletePublication,
} from '../controllers/publication';
import { protectRoute } from '../controllers/auth';

const router = express.Router();

router
  .route('/publication')
  .get(searchPublications)
  .post(protectRoute, upload)
  .delete(protectRoute, batchDeletePublication);
router
  .route('/publication/:id')
  .get(getPublication)
  .put(protectRoute, editPublication)
  .delete(protectRoute, deletePublication);

router.route('/searchpublication').get(getPublication);
router.route('/singlepublication').post(uploadSingle);

export default router;
