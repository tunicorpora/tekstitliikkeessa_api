import express from 'express';
import {
  getAuthor,
  getAuthors,
  updateAuthor,
  saveAuthor,
  deleteAuthor,
  getAuthorNames,
  deleteSingleAuthor,
} from '../controllers/author';
import { protectRoute } from '../controllers/auth';

const router = express.Router();

router
  .route('/author')
  .get(getAuthors)
  .put(protectRoute, updateAuthor)
  .post(protectRoute, saveAuthor)
  .delete(protectRoute, deleteAuthor);

router.route('/author/:name').get(getAuthor);
router.route('/author/:id').delete(deleteSingleAuthor);
router.route('/authornames').get(getAuthorNames);

export default router;
