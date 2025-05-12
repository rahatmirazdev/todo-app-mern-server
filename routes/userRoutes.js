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

// Simple status endpoint for availability checks
router.get('/status', (req, res) => {
    res.json({ status: 'API is available' });
});

router.route('/').post(registerUser);
router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);
router.route('/preferences')
    .get(protect, getUserPreferences)
    .put(protect, updateUserPreferences);
export default router;
