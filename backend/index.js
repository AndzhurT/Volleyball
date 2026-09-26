// index.js
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');

if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set in environment variables');
}

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables');
}

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = new Set([process.env.FRONTEND_URL, process.env.ADMIN_FRONTEND_URL].filter(Boolean));

app.disable('x-powered-by');
app.use(helmet());
app.use((req, res, next) => {
    const origin = req.get('origin');
    if (origin && allowedOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }

    if (req.method === 'OPTIONS') {
        if (origin && !allowedOrigins.has(origin)) return res.sendStatus(403);
        return res.sendStatus(204);
    }

    next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many login attempts. Please try again in 15 minutes.',
    },
    skipSuccessfulRequests: true,
});

app.use('/api/auth/login', loginLimiter);

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Volleyball API!');
});

// Mount your routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const gameActionRequestRoutes = require('./routes/game-action-requests');

app.use('/api/auth', authRoutes); // → Login: /api/auth/login
app.use('/api/games', gameRoutes);
app.use('/api/action-requests', gameActionRequestRoutes);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';

    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack || err);
    }

    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
});

if (require.main === module) {
    connectDB();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
