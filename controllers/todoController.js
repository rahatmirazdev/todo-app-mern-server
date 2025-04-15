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
    const {
        status,
        priority,
        category,
        search,
        sortBy,
        order,
        page = 1,
        limit = 10,
        dueDateFrom,
        dueDateTo
    } = req.query;

    // Build query
    const query = { user: req.user._id };

    // Add filters if they exist
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Due date filtering
    if (dueDateFrom === 'none') {
        // No due date set
        query.dueDate = null;
    } else if (dueDateFrom || dueDateTo) {
        query.dueDate = {};

        if (dueDateFrom) {
            const fromDate = new Date(dueDateFrom);
            fromDate.setHours(0, 0, 0, 0);
            query.dueDate.$gte = fromDate;
        }

        if (dueDateTo) {
            const toDate = new Date(dueDateTo);
            toDate.setHours(23, 59, 59, 999);
            query.dueDate.$lte = toDate;
        }
    }

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
    const { status, comment } = req.body;

    const todo = await Todo.findById(req.params.id);

    if (todo && todo.user.toString() === req.user._id.toString()) {
        // Only add to history if status actually changes
        if (status !== todo.status) {
            // Add status change to history
            todo.statusHistory.push({
                fromStatus: todo.status,
                toStatus: status,
                changedAt: new Date(),
                comment: comment || ''
            });

            // Update the status
            todo.status = status;

            // Set completedAt timestamp when completing a todo
            if (status === 'completed' && todo.completedAt === null) {
                todo.completedAt = new Date();
            } else if (status !== 'completed') {
                todo.completedAt = null;
            }
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

// @desc    Get todo summary by priority and due date
// @route   GET /api/todos/summary
// @access  Private
const getTodoSummary = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Get priority counts
    const priorityCounts = await Todo.aggregate([
        { $match: { user: userId, status: { $ne: 'completed' } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get due date counts
    const overdueTasks = await Todo.countDocuments({
        user: userId,
        dueDate: { $lt: today },
        status: { $ne: 'completed' }
    });

    const todayTasks = await Todo.countDocuments({
        user: userId,
        dueDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'completed' }
    });

    const upcomingTasks = await Todo.countDocuments({
        user: userId,
        dueDate: { $gte: tomorrow, $lt: nextWeek },
        status: { $ne: 'completed' }
    });

    const laterTasks = await Todo.countDocuments({
        user: userId,
        dueDate: { $gte: nextWeek },
        status: { $ne: 'completed' }
    });

    const noDueDateTasks = await Todo.countDocuments({
        user: userId,
        dueDate: null,
        status: { $ne: 'completed' }
    });

    // Format priority counts into object
    const priorityData = {
        high: 0,
        medium: 0,
        low: 0
    };

    priorityCounts.forEach(item => {
        if (item._id && priorityData.hasOwnProperty(item._id)) {
            priorityData[item._id] = item.count;
        }
    });

    res.json({
        priority: priorityData,
        dueDate: {
            overdue: overdueTasks,
            today: todayTasks,
            upcoming: upcomingTasks,
            later: laterTasks,
            noDueDate: noDueDateTasks
        }
    });
});

// @desc    Get status history for a todo
// @route   GET /api/todos/:id/history
// @access  Private
const getTodoStatusHistory = asyncHandler(async (req, res) => {
    const todo = await Todo.findById(req.params.id);

    if (todo && todo.user.toString() === req.user._id.toString()) {
        res.json(todo.statusHistory);
    } else {
        res.status(404);
        throw new Error('Todo not found');
    }
});

export {
    createTodo,
    getTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
    updateTodoStatus,
    getTodoStats,
    getTodoSummary,
    getTodoStatusHistory
};
