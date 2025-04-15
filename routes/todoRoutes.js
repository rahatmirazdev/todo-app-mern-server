import express from 'express';
import {
    createTodo,
    getTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
    updateTodoStatus,
    getTodoStats
} from '../controllers/todoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected with auth middleware
router.use(protect);

router.route('/')
    .post(createTodo)
    .get(getTodos);

router.get('/stats', getTodoStats);

router.route('/:id')
    .get(getTodoById)
    .put(updateTodo)
    .delete(deleteTodo);

router.route('/:id/status')
    .patch(updateTodoStatus);

export default router;
