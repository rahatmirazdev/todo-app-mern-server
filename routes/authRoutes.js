import express from 'express';
import {
    loginUser,
    validateToken,
    googleLogin,
    refreshToken,
    revokeToken,
    getUserSessions
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', protect, revokeToken);
router.get('/sessions', protect, getUserSessions);
router.get('/validate-token', protect, validateToken);

export default router;
