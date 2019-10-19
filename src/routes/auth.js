import express from 'express';
import { signIn, signOut } from '../controllers/auth';

const router = express.Router();
router.route('/signin').post(signIn);
router.route('/signout').get(signOut);

export default router;
