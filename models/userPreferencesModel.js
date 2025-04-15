import mongoose from 'mongoose';

const userPreferencesSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        },
        notifications: {
            enabled: { type: Boolean, default: true },
            browser: { type: Boolean, default: true },
            desktop: { type: Boolean, default: true }
        },
        taskDefaults: {
            defaultPriority: { type: String, default: 'medium' },
            defaultCategory: { type: String, default: 'general' },
            defaultView: { type: String, default: 'list' },
            autoCreateSubtasks: { type: Boolean, default: false }
        },
        privacy: {
            allowAnalytics: { type: Boolean, default: true },
            storeHistory: { type: Boolean, default: true },
            autoDeleteCompleted: { type: Boolean, default: false },
            deleteAfterDays: { type: Number, default: 30 }
        }
    },
    { timestamps: true }
);

const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

export default UserPreferences;