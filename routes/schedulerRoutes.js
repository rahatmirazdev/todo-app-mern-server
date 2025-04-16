import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { recordTaskProductivity, getTaskRecommendations, startTask, scheduleTask } from '../controllers/schedulerController.js';

const router = express.Router();

// All routes are protected with auth middleware
router.patch('/start-task/:id', protect, startTask);
router.patch('/schedule/:id', protect, scheduleTask);
router.get('/recommendations/:id', protect, getTaskRecommendations);
router.post('/record-productivity/:id', protect, recordTaskProductivity);

export default router;
