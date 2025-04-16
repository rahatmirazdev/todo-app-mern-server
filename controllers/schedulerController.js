import asyncHandler from 'express-async-handler';
import Todo from '../models/todoModel.js';
import schedulerService from '../services/schedulerService.js';

// @desc    Mark task as started (to track actual duration)
// @route   PATCH /api/scheduler/start-task/:id
// @access  Private
const startTask = asyncHandler(async (req, res) => {
    const todoId = req.params.id;
    const todo = await Todo.findById(todoId);

    if (!todo) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (todo.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this task');
    }

    // Mark as started
    todo.startedAt = new Date();
    todo.status = 'in_progress';

    const updatedTodo = await todo.save();

    res.json(updatedTodo);
});

// @desc    Schedule a task for a specific time
// @route   PATCH /api/scheduler/schedule/:id
// @access  Private
const scheduleTask = asyncHandler(async (req, res) => {
    const todoId = req.params.id;
    const { scheduledTime } = req.body;

    if (!scheduledTime) {
        res.status(400);
        throw new Error('Scheduled time is required');
    }

    const todo = await Todo.findById(todoId);

    if (!todo) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (todo.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this task');
    }

    // Schedule the task
    todo.scheduledTime = new Date(scheduledTime);

    const updatedTodo = await todo.save();

    res.json(updatedTodo);
});

// Additional controller functions for recommendations and productivity
const getTaskRecommendations = asyncHandler(async (req, res) => {
    // Implementation for getting scheduling recommendations
    res.json({ message: "Recommendations endpoint - implement based on your scheduling algorithm" });
});

const recordTaskProductivity = asyncHandler(async (req, res) => {
    // Implementation for recording task productivity
    res.json({ message: "Productivity recording endpoint - implement based on your requirements" });
});

export {
    recordTaskProductivity,
    getTaskRecommendations,
    startTask,
    scheduleTask
};
