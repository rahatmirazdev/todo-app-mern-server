import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

// Import route files
import userRoutes from './routes/userRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import schedulerRoutes from './routes/schedulerRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
const dbConnected = await connectDB();

// Log if DB connection failed but continue running the API
if (!dbConnected) {
    console.error('WARNING: Server running without database connection!');
}

// Middleware
app.use(cors({
    origin: ['https://taskiwala.netlify.app', 'https://www.taskiwala.netlify.app', 'https://taskistation.web.app', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));

// Create public directory for assets if it doesn't exist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/scheduler', schedulerRoutes);

// Base route
app.get('/', (req, res) => {
    // Set explicit CORS headers for the root path
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.json({
        message: 'API is running...',
        environment: process.env.NODE_ENV || 'development',
        dbConnected: dbConnected,
        timestamp: new Date().toISOString()
    });
});

// Error Handling middleware
app.use(notFound);
app.use(errorHandler);

// Set port and start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
