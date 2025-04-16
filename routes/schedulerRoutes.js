import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    recordTaskProductivity,
    getTaskRecommendations,
    startTask,
    scheduleTask
} from '../controllers/schedulerController.js';

const router = express.Router();

// Routes for scheduler functionality
router.post('/record-productivity/:id', protect, recordTaskProductivity);
router.get('/recommendations/:id', protect, getTaskRecommendations);
router.patch('/start-task/:id', protect, startTask);
router.patch('/schedule/:id', protect, scheduleTask);

export default router;
