import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import UserPreferences from '../models/userPreferencesModel.js';  // Add this import

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePicture: user.profilePicture,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePicture: user.profilePicture,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.profilePicture = req.body.profilePicture || user.profilePicture;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            profilePicture: updatedUser.profilePicture,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
const getUserPreferences = asyncHandler(async (req, res) => {
    // Find preferences or create default if none exists
    let preferences = await UserPreferences.findOne({ user: req.user._id });

    if (!preferences) {
        // Create default preferences
        preferences = await UserPreferences.create({
            user: req.user._id
            // Schema defaults will handle the rest
        });
    }

    res.json(preferences);
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updateUserPreferences = asyncHandler(async (req, res) => {
    let preferences = await UserPreferences.findOne({ user: req.user._id });

    if (!preferences) {
        // Create with provided values
        preferences = await UserPreferences.create({
            user: req.user._id,
            ...req.body
        });
    } else {
        // Update existing preferences
        // Only update fields that were sent in the request
        if (req.body.theme) preferences.theme = req.body.theme;

        if (req.body.notifications) {
            preferences.notifications = {
                ...preferences.notifications,
                ...req.body.notifications
            };
        }

        if (req.body.taskDefaults) {
            preferences.taskDefaults = {
                ...preferences.taskDefaults,
                ...req.body.taskDefaults
            };
        }

        if (req.body.privacy) {
            preferences.privacy = {
                ...preferences.privacy,
                ...req.body.privacy
            };
        }

        await preferences.save();
    }

    res.json(preferences);
});

export {
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUserPreferences,
    updateUserPreferences
};
