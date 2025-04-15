import mongoose from 'mongoose';

const refreshTokenSchema = mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isRevoked: {
            type: Boolean,
            default: false
        },
        userAgent: {
            type: String,
            required: false
        },
        ipAddress: {
            type: String,
            required: false
        },
        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true,
    }
);

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
