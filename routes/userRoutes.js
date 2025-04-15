import express from 'express';
import {
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUserPreferences,  // Added this import
    updateUserPreferences  // Added this import
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser);
router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);
router.route('/preferences')
    .get(protect, getUserPreferences)
    .put(protect, updateUserPreferences);
export default router;
