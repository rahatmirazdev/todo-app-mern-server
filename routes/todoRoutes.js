import express from 'express';
import {
    createTodo,
    getTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
    updateTodoStatus,
    getTodoStats,
    getTodoSummary,
    getTodoStatusHistory,
    getTodoTags,
    getRecurringSeries,
    getAllTodos,
    importTodos,
    suggestSubtasks,
    parseNaturalLanguageTask
} from '../controllers/todoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected with auth middleware
router.use(protect);

// Route for getting all todos (simplified, for dependency selection)
router.get('/all', getAllTodos);

router.route('/')
    .post(createTodo)
    .get(getTodos);

router.get('/stats', getTodoStats);
router.get('/summary', getTodoSummary);

// Add the new route for tags
router.route('/tags')
    .get(protect, getTodoTags);

router.route('/:id')
    .get(getTodoById)
    .put(updateTodo)
    .delete(deleteTodo);

router.route('/:id/status')
    .patch(updateTodoStatus);

router.route('/:id/history')
    .get(getTodoStatusHistory);

// Route for recurring task series
router.route('/series/:recurringId').get(protect, getRecurringSeries);
router.get('/series/:recurringId', protect, getRecurringSeries);

// Add this route for importing tasks
router.route('/import')
    .post(protect, importTodos);

// Route for suggesting subtasks with AI
router.post('/suggest-subtasks', protect, suggestSubtasks);

// Route for parsing natural language task descriptions
router.post('/parse-natural-language', protect, parseNaturalLanguageTask);

export default router;
