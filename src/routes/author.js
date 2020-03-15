import express from 'express';
import {
  getAuthor,
  getAuthors,
  updateAuthor,
  saveAuthor,
  deleteAuthor,
  getAuthorNames,
  getAuthorLetters,
  deleteSingleAuthor,
  combineAuthors,
} from '../controllers/author';
import { protectRoute } from '../controllers/auth';

const router = express.Router();

router
  .route('/author')
  .get(getAuthors)
  .put(protectRoute, updateAuthor)
  .post(protectRoute, saveAuthor)
  .delete(protectRoute, deleteAuthor);

router.route('/authors/combine/:from/:to').post(combineAuthors);
router.route('/author/:name').get(getAuthor);
router.route('/author/:id').delete(deleteSingleAuthor);
router.route('/authornames').get(getAuthorNames);
router.route('/authorletters').get(getAuthorLetters);

export default router;
