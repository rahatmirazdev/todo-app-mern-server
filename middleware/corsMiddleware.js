/**
 * Custom CORS middleware to ensure proper handling of preflight requests
 * and consistent CORS headers across all responses
 */

const allowedOrigins = [
    'https://taskiwala.netlify.app',
    'https://www.taskiwala.netlify.app',
    'https://todo-app-mern-server-a9rx.onrender.com',
    'https://taskistation.web.app',
    'http://localhost:5173',
    'http://localhost:5000'
];

export const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;

    // Allow specific origins or all in development
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        res.header('Access-Control-Allow-Origin', origin);
    }

    // Essential CORS headers
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        // Preflight requests need these additional headers
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.status(204).end();
    }

    next();
};
