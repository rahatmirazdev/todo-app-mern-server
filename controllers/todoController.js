import asyncHandler from 'express-async-handler';
import Todo from '../models/todoModel.js';
import { generateNextRecurringTask } from '../utils/recurringTaskUtils.js';

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
        dueDateTo,
        tags,
        hasSubtasks,
        completedSubtasks,
        secondarySortBy,
        secondaryOrder
    } = req.query;

    // Build query
    const query = { user: req.user._id };

    // Add filters if they exist
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Tag filtering
    if (tags) {
        // Handle both single tag and array of tags
        if (Array.isArray(tags)) {
            query.tags = { $in: tags };
        } else {
            query.tags = tags;
        }
    }

    // Subtask filtering
    if (hasSubtasks === 'true') {
        query['subtasks.0'] = { $exists: true };
    } else if (hasSubtasks === 'false') {
        query.subtasks = { $size: 0 };
    }

    // Subtask completion filtering (only applicable if hasSubtasks is true)
    if (hasSubtasks === 'true' && completedSubtasks) {
        if (completedSubtasks === 'all') {
            query.$expr = { $eq: [{ $size: "$subtasks" }, { $size: { $filter: { input: "$subtasks", as: "subtask", cond: { $eq: ["$$subtask.completed", true] } } } }] };
        } else if (completedSubtasks === 'none') {
            query.$expr = { $eq: [{ $size: { $filter: { input: "$subtasks", as: "subtask", cond: { $eq: ["$$subtask.completed", true] } } } }, 0] };
        } else if (completedSubtasks === 'some') {
            query.$and = [
                { $expr: { $gt: [{ $size: { $filter: { input: "$subtasks", as: "subtask", cond: { $eq: ["$$subtask.completed", true] } } } }, 0] } },
                { $expr: { $lt: [{ $size: { $filter: { input: "$subtasks", as: "subtask", cond: { $eq: ["$$subtask.completed", true] } } } }, { $size: "$subtasks" }] } }
            ];
        }
    }

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
        const searchRegex = { $regex: search, $options: 'i' };
        query.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
            { tags: searchRegex },
            // Also search in subtasks titles
            { 'subtasks.title': searchRegex }
        ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;

        // Secondary sorting
        if (secondarySortBy) {
            sortOptions[secondarySortBy] = secondaryOrder === 'desc' ? -1 : 1;
        }
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

// @desc    Get all todos for the current user (simplified, for dependency selection)
// @route   GET /api/todos/all
// @access  Private
const getAllTodos = asyncHandler(async (req, res) => {
    const todos = await Todo.find({
        user: req.user._id,
        // Don't include completed tasks in dependencies to avoid circular dependencies
        status: { $ne: 'completed' }
    })
        .select('_id title status')
        .sort({ createdAt: -1 });

    res.json(todos);
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
    const { id } = req.params;
    const { status, comment } = req.body;

    const todo = await Todo.findById(id);

    if (todo && todo.user.toString() === req.user._id.toString()) {
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
            let newRecurringTask = null;

            if (status === 'completed' && todo.completedAt === null) {
                todo.completedAt = new Date();

                // If this is a recurring task and it's being completed, generate the next instance
                if (todo.isRecurring) {
                    newRecurringTask = await generateNextRecurringTask(todo);
                }
            } else if (status !== 'completed') {
                todo.completedAt = null;
            }

            const updatedTodo = await todo.save();

            // If a new recurring task was created, include it in the response
            if (newRecurringTask) {
                res.json({
                    updatedTodo,
                    newRecurringTask
                });
            } else {
                res.json(updatedTodo);
            }
        } else {
            res.json(todo); // No change needed
        }
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

    // Initialize the stats object
    const stats = {
        total: 0,
        active: 0,
        completed: 0
    };

    // Query for status counts
    const statusCounts = await Todo.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Process the status counts
    statusCounts.forEach(status => {
        stats.total += status.count;

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

// @desc    Get all unique tags for the user
// @route   GET /api/todos/tags
// @access  Private
const getTodoTags = asyncHandler(async (req, res) => {
    const tags = await Todo.aggregate([
        { $match: { user: req.user._id } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags" } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, tag: "$_id" } }
    ]);

    res.json({ tags: tags.map(item => item.tag) });
});

// @desc    Get all todos in a recurring series
// @route   GET /api/todos/series/:recurringId
// @access  Private
const getRecurringSeries = asyncHandler(async (req, res) => {
    const { recurringId } = req.params;

    // Find the original recurring todo
    const originalTodo = await Todo.findById(recurringId);

    if (!originalTodo || originalTodo.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Todo not found');
    }

    // Find all todos in the series (original or derived from it)
    const seriesTodos = await Todo.find({
        $or: [
            { _id: recurringId },
            { recurringParentId: recurringId }
        ],
        user: req.user._id
    }).sort({ createdAt: 1 });

    res.json(seriesTodos);
});

// @desc    Import todos from JSON
// @route   POST /api/todos/import
// @access  Private
const importTodos = asyncHandler(async (req, res) => {
    const { todos } = req.body;

    if (!todos || !Array.isArray(todos)) {
        res.status(400);
        throw new Error('Invalid import data format');
    }

    // Process and save each todo
    const importResults = [];

    for (const todo of todos) {
        try {
            // Create a new todo based on the imported data
            const newTodo = {
                title: todo.title,
                description: todo.description || '',
                status: ['todo', 'in_progress', 'completed'].includes(todo.status) ? todo.status : 'todo',
                priority: ['low', 'medium', 'high'].includes(todo.priority) ? todo.priority : 'medium',
                category: todo.category || 'general',
                tags: Array.isArray(todo.tags) ? todo.tags : [],
                dueDate: todo.dueDate || null,
                user: req.user._id, // Assign to current user
                subtasks: Array.isArray(todo.subtasks) ? todo.subtasks.map(st => ({
                    title: st.title,
                    completed: st.completed || false,
                    completedAt: st.completedAt || null
                })) : []
            };

            // Save to database
            await Todo.create(newTodo);
            importResults.push({ title: todo.title, success: true });
        } catch (error) {
            importResults.push({ title: todo.title, success: false, error: error.message });
        }
    }

    res.status(201).json({
        message: `Successfully imported ${importResults.filter(r => r.success).length} of ${todos.length} tasks`,
        results: importResults
    });
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
    getTodoStatusHistory,
    getTodoTags,
    getRecurringSeries,
    getAllTodos,
    importTodos
};
