import mongoose from 'mongoose';

const productivityRecordSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        todo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Todo',
            required: true
        },
        timeOfDay: {
            type: String,
            enum: ['morning', 'afternoon', 'evening'],
            required: true
        },
        estimatedDuration: {
            type: Number, // In minutes
            required: true
        },
        actualDuration: {
            type: Number, // In minutes
            required: true
        },
        efficiency: {
            type: Number, // Calculated as estimated/actual (or vice versa if actual is less)
            required: true
        },
        taskType: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        dayOfWeek: {
            type: Number, // 0-6 (Sunday-Saturday)
            required: true
        },
        date: {
            type: Date,
            required: true
        }
    },
    { timestamps: true }
);

// Create indexes for efficient querying
productivityRecordSchema.index({ user: 1, timeOfDay: 1 });
productivityRecordSchema.index({ user: 1, taskType: 1 });
productivityRecordSchema.index({ user: 1, dayOfWeek: 1 });

const ProductivityRecord = mongoose.model('ProductivityRecord', productivityRecordSchema);

export default ProductivityRecord;
