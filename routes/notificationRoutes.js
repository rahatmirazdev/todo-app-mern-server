import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    sendTestNotification,
    sendDueTasksNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

// Routes for desktop notifications
router.post('/test', protect, sendTestNotification);
router.post('/due-tasks', protect, sendDueTasksNotifications);

export default router;
