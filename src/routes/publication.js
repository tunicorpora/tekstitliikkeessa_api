import express from 'express';
import {
  deletePublication,
  searchPublications,
  editPublication,
  getPublication,
  upload,
} from '../controllers/publication';
import { protectRoute } from '../controllers/auth';

const router = express.Router();

router
  .route('/publication')
  .get(searchPublications)
  .post(protectRoute, upload);
router
  .route('/publication/:id')
  .get(getPublication)
  .put(protectRoute, editPublication)
  .delete(protectRoute, deletePublication);
router.route('/searchpublication').get(getPublication);

export default router;
