import Todo from '../models/todoModel.js';

/**
 * Generate the next instance of a recurring task
 * @param {Object} completedTodo - The completed todo that needs to be regenerated
 * @returns {Object} The new todo instance
 */
export const generateNextRecurringTask = async (completedTodo) => {
    if (!completedTodo.isRecurring) {
        return null;
    }

    // Check if we've reached the end date
    if (completedTodo.recurringEndDate && new Date() > new Date(completedTodo.recurringEndDate)) {
        return null;
    }

    // Calculate the next due date based on the recurring pattern
    const nextDueDate = calculateNextDueDate(completedTodo.dueDate, completedTodo.recurringPattern);

    // Check if next due date is after end date
    if (completedTodo.recurringEndDate && nextDueDate > new Date(completedTodo.recurringEndDate)) {
        return null;
    }

    // Create a new todo based on the completed one
    const newTodoData = {
        user: completedTodo.user,
        title: completedTodo.title,
        description: completedTodo.description,
        status: 'todo', // Always start as todo
        priority: completedTodo.priority,
        dueDate: nextDueDate,
        category: completedTodo.category,
        tags: completedTodo.tags,
        isRecurring: completedTodo.isRecurring,
        recurringPattern: completedTodo.recurringPattern,
        recurringEndDate: completedTodo.recurringEndDate,
        recurringParentId: completedTodo.recurringParentId || completedTodo._id,
        subtasks: completedTodo.subtasks.map(subtask => ({
            title: subtask.title,
            completed: false,
            completedAt: null
        }))
    };

    const newTodo = await Todo.create(newTodoData);
    return newTodo;
};

/**
 * Calculate the next due date based on the current due date and recurring pattern
 * @param {Date} currentDueDate - The current due date
 * @param {String} pattern - The recurring pattern (daily, weekly, monthly)
 * @returns {Date} The next due date
 */
const calculateNextDueDate = (currentDueDate, pattern) => {
    if (!currentDueDate) {
        // If no due date was set, use tomorrow as the default
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }

    const dueDate = new Date(currentDueDate);
    
    switch (pattern) {
        case 'daily':
            dueDate.setDate(dueDate.getDate() + 1);
            break;
        case 'weekly':
            dueDate.setDate(dueDate.getDate() + 7);
            break;
        case 'monthly':
            // Move to the same day of next month
            dueDate.setMonth(dueDate.getMonth() + 1);
            break;
        default:
            dueDate.setDate(dueDate.getDate() + 1); // Default to daily
    }
    
    return dueDate;
};
