import asyncHandler from 'express-async-handler';
import Todo from '../models/todoModel.js';

// @desc    Create a new todo
// @route   POST /api/todos
// @access  Private
const createTodo = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        status,
        priority,
        dueDate,
        category,
        tags,
        subtasks,
        isRecurring,
        recurringPattern,
        recurringEndDate
    } = req.body;

    const todo = await Todo.create({
        user: req.user._id,
        title,
        description,
        status,
        priority,
        dueDate,
        category,
        tags,
        subtasks,
        isRecurring,
        recurringPattern,
        recurringEndDate
    });

    if (todo) {
        res.status(201).json(todo);
    } else {
        res.status(400);
        throw new Error('Invalid todo data');
    }
});

// @desc    Get all todos for logged in user
// @route   GET /api/todos
// @access  Private
const getTodos = asyncHandler(async (req, res) => {
    const { status, priority, category, search, sortBy, order, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { user: req.user._id };

    // Add filters if they exist
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Search functionality
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
        // Default sort by createdAt descending (newest first)
        sortOptions.createdAt = -1;
    }

    // Execute query with pagination and sorting
    const todos = await Todo.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Todo.countDocuments(query);

    res.json({
        todos,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// @desc    Get todo by ID
// @route   GET /api/todos/:id
// @access  Private
const getTodoById = asyncHandler(async (req, res) => {
    const todo = await Todo.findById(req.params.id);

    if (todo && todo.user.toString() === req.user._id.toString()) {
        res.json(todo);
    } else {
        res.status(404);
        throw new Error('Todo not found');
    }
});

// @desc    Update a todo
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        status,
        priority,
        dueDate,
        category,
        tags,
        subtasks,
        isRecurring,
        recurringPattern,
        recurringEndDate
    } = req.body;

    const todo = await Todo.findById(req.params.id);

    if (todo && todo.user.toString() === req.user._id.toString()) {
        todo.title = title || todo.title;
        todo.description = description !== undefined ? description : todo.description;
        todo.status = status || todo.status;
        todo.priority = priority || todo.priority;
        todo.dueDate = dueDate !== undefined ? dueDate : todo.dueDate;
        todo.category = category || todo.category;
        todo.tags = tags || todo.tags;
        todo.subtasks = subtasks || todo.subtasks;
        todo.isRecurring = isRecurring !== undefined ? isRecurring : todo.isRecurring;
        todo.recurringPattern = recurringPattern !== undefined ? recurringPattern : todo.recurringPattern;
        todo.recurringEndDate = recurringEndDate !== undefined ? recurringEndDate : todo.recurringEndDate;

        // Set completedAt date when status changes to completed
        if (status === 'completed' && todo.status !== 'completed') {
            todo.completedAt = new Date();
        } else if (status !== 'completed') {
            todo.completedAt = null;
        }

        const updatedTodo = await todo.save();
        res.json(updatedTodo);
    } else {
        res.status(404);
        throw new Error('Todo not found');
    }
});

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = asyncHandler(async (req, res) => {
    const todo = await Todo.findById(req.params.id);

    if (todo && todo.user.toString() === req.user._id.toString()) {
        await todo.deleteOne();
        res.json({ message: 'Todo removed' });
    } else {
        res.status(404);
        throw new Error('Todo not found');
    }
});

// @desc    Update todo status
// @route   PATCH /api/todos/:id/status
// @access  Private
const updateTodoStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const todo = await Todo.findById(req.params.id);

    if (todo && todo.user.toString() === req.user._id.toString()) {
        todo.status = status;

        // Set completedAt timestamp when completing a todo
        if (status === 'completed' && todo.completedAt === null) {
            todo.completedAt = new Date();
        } else if (status !== 'completed') {
            todo.completedAt = null;
        }

        const updatedTodo = await todo.save();
        res.json(updatedTodo);
    } else {
        res.status(404);
        throw new Error('Todo not found');
    }
});

// @desc    Get todo stats for the current user
// @route   GET /api/todos/stats
// @access  Private
const getTodoStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Query for total count
    const totalCount = await Todo.countDocuments({ user: userId });

    // Query for status counts
    const statusCounts = await Todo.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Convert the aggregation result to a more usable format
    const stats = {
        total: totalCount,
        active: 0,
        completed: 0
    };

    statusCounts.forEach(status => {
        if (status._id === 'completed') {
            stats.completed = status.count;
        } else {
            // Count both 'todo' and 'in_progress' as active
            stats.active += status.count;
        }
    });

    res.json(stats);
});

export {
    createTodo,
    getTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
    updateTodoStatus,
    getTodoStats
};
