import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import RefreshToken from '../models/refreshTokenModel.js';
import generateTokens, { generateAccessToken } from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password is correct
    if (user && (await user.matchPassword(password))) {
        // Update last login time
        user.lastLogin = new Date();
        await user.save();

        // Get client info from request
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip;

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = await generateTokens(
            user._id,
            userAgent,
            ipAddress
        );

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePicture: user.profilePicture,
            lastLogin: user.lastLogin,
            token: accessToken,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
    // Get refresh token from cookie or request body
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
        res.status(401);
        throw new Error('Refresh token is required');
    }

    // Find the refresh token in the database
    const storedToken = await RefreshToken.findOne({
        token,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
    });

    if (!storedToken) {
        res.status(401);
        throw new Error('Invalid or expired refresh token');
    }

    // Get the user associated with the token
    const user = await User.findById(storedToken.user);

    if (!user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Generate a new access token
    const accessToken = generateAccessToken(user._id);

    res.json({
        token: accessToken
    });
});

// @desc    Revoke a refresh token (logout)
// @route   POST /api/auth/revoke-token
// @access  Private
const revokeToken = asyncHandler(async (req, res) => {
    // Get token from request body or cookie
    const token = req.body.refreshToken || req.cookies.refreshToken;

    // Get session ID if we're revoking a specific session
    const sessionId = req.body.sessionId;

    if (!token && !sessionId) {
        res.status(400);
        throw new Error('Token or session ID is required');
    }

    // If sessionId is provided, revoke that specific session
    if (sessionId) {
        const session = await RefreshToken.findById(sessionId);

        if (!session || session.user.toString() !== req.user._id.toString()) {
            res.status(404);
            throw new Error('Session not found or not owned by user');
        }

        session.isRevoked = true;
        await session.save();

        // Clear cookie if this was the current session
        if (session.token === req.cookies.refreshToken) {
            res.clearCookie('refreshToken');
        }
    } else {
        // Revoke the specific token
        const refreshToken = await RefreshToken.findOne({ token });

        if (!refreshToken || refreshToken.user.toString() !== req.user._id.toString()) {
            res.status(404);
            throw new Error('Token not found or not owned by user');
        }

        refreshToken.isRevoked = true;
        await refreshToken.save();

        // Clear the cookie
        res.clearCookie('refreshToken');
    }

    res.status(200).json({ message: 'Token revoked successfully' });
});

// @desc    Get all active sessions for current user
// @route   GET /api/auth/sessions
// @access  Private
const getUserSessions = asyncHandler(async (req, res) => {
    const sessions = await RefreshToken.find({
        user: req.user._id,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
    }).select('createdAt userAgent ipAddress _id');

    res.json(sessions);
});

// @desc    Validate token
// @route   GET /api/auth/validate-token
// @access  Private
const validateToken = asyncHandler(async (req, res) => {
    res.json({ valid: true, user: req.user });
});

// @desc    Auth user with Google & get token
// @route   POST /api/auth/google-login
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
    const { email, name, profilePicture, firebaseUid } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    // Find if user exists
    let user = await User.findOne({ email });

    if (user) {
        // User exists, update their details
        user.name = name || user.name;
        user.profilePicture = profilePicture || user.profilePicture;
        user.firebaseUid = firebaseUid || user.firebaseUid;
        user.lastLogin = new Date();

        await user.save();
    } else {
        // Create new user with a random password (since we're using Firebase auth)
        const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

        user = await User.create({
            name,
            email,
            password,
            profilePicture,
            firebaseUid,
            lastLogin: new Date()
        });
    }

    // Get client info from request
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateTokens(
        user._id,
        userAgent,
        ipAddress
    );

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePicture: user.profilePicture,
            lastLogin: user.lastLogin,
            token: accessToken,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

export { loginUser, validateToken, googleLogin, refreshToken, revokeToken, getUserSessions };
