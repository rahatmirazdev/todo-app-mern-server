import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

// Import route files
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import todoRoutes from './routes/todoRoutes.js';  // Add todo routes import
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());  // Add cookie parser
app.use(morgan('dev'));

// Define Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);  // Register todo routes

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
    // console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
