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
connectDB();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://taskiwala.netlify.app', 'https://www.taskiwala.netlify.app', 'https://taskistation.web.app']
        : 'http://localhost:5173',
    credentials: true
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
    res.json({ message: 'API is running...' });
});

// Error Handling middleware
app.use(notFound);
app.use(errorHandler);

// Set port and start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
