import asyncHandler from 'express-async-handler';
import notificationService from '../services/notificationService.js';
import Todo from '../models/todoModel.js';

// @desc    Send a test notification
// @route   POST /api/notifications/test
// @access  Private
const sendTestNotification = asyncHandler(async (req, res) => {
    try {
        const result = await notificationService.sendTestNotification();

        res.json({
            success: true,
            message: 'Test notification sent',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});

// @desc    Send notifications for tasks due today
// @route   POST /api/notifications/due-tasks
// @access  Private
const sendDueTasksNotifications = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        // Get current date with time set to midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find tasks due today
        const dueTasks = await Todo.find({
            user: userId,
            dueDate: { $gte: today, $lt: tomorrow },
            status: { $ne: 'completed' }
        });

        if (dueTasks.length === 0) {
            return res.json({
                success: true,
                message: 'No due tasks to notify about'
            });
        }

        // Send notifications for each task
        const notificationResults = [];
        for (const task of dueTasks) {
            const result = await notificationService.sendTaskReminder(task);
            notificationResults.push({
                taskId: task._id,
                taskTitle: task.title,
                result
            });
        }

        res.json({
            success: true,
            message: `Sent ${dueTasks.length} task notifications`,
            tasks: notificationResults
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send due task notifications',
            error: error.message
        });
    }
});

export { sendTestNotification, sendDueTasksNotifications };
