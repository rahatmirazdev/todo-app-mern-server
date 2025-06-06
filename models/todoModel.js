import mongoose from 'mongoose';

const subtaskSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

const statusHistorySchema = mongoose.Schema(
    {
        fromStatus: {
            type: String,
            enum: ['todo', 'in_progress', 'completed'],
            required: true
        },
        toStatus: {
            type: String,
            enum: ['todo', 'in_progress', 'completed'],
            required: true
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        comment: {
            type: String,
            default: ''
        }
    },
    { _id: false }
);

const todoSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['todo', 'in_progress', 'completed'],
            default: 'todo'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        dueDate: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        },
        category: {
            type: String,
            default: 'general',
            trim: true
        },
        tags: [{
            type: String,
            trim: true
        }],
        isRecurring: {
            type: Boolean,
            default: false
        },
        recurringPattern: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'daily'
        },
        recurringEndDate: {
            type: Date,
            default: null
        },
        // Add duration estimate and scheduling fields
        estimatedDuration: {
            type: Number, // In minutes
            default: 30
        },
        optimalTimeOfDay: {
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'any'],
            default: 'any'
        },
        scheduledTime: {
            type: Date,
            default: null
        },
        actualDuration: {
            type: Number, // In minutes
            default: null
        },
        startedAt: {
            type: Date,
            default: null
        },
        // Track task type for better recommendations
        taskType: {
            type: String,
            default: 'general'
        },
        dependencies: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Todo'
        }],
        subtasks: [subtaskSchema],
        parentTodo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Todo',
            default: null
        },
        statusHistory: [statusHistorySchema]
    },
    {
        timestamps: true
    }
);

// Add indexes for faster queries
todoSchema.index({ user: 1, status: 1 });
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ user: 1, category: 1 });

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;
