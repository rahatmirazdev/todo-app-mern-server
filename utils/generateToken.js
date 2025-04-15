import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/refreshTokenModel.js';

// Generate short-lived access token (15 minutes)
export const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });
};

// Generate long-lived refresh token (7 days)
export const generateRefreshToken = async (userId, userAgent = null, ipAddress = null) => {
    // Create a secure random token
    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database
    await RefreshToken.create({
        token: refreshToken,
        user: userId,
        userAgent,
        ipAddress,
        expiresAt
    });

    return refreshToken;
};

// Generate both access and refresh tokens
const generateTokens = async (userId, userAgent = null, ipAddress = null) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = await generateRefreshToken(userId, userAgent, ipAddress);

    return {
        accessToken,
        refreshToken
    };
};

export default generateTokens;
