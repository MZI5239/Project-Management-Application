// server/server.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'taskflow_dev_secret_key_12345';
    console.warn('WARNING: JWT_SECRET not found in environment. Using default development secret.');
}

// Body parser
app.use(express.json());
app.use(cookieParser());

// Security middlewares
app.use(helmet({ contentSecurityPolicy: false }));

// ✅ Updated CORS — allows all Vercel preview URLs
app.use(cors({
    origin: function(origin, callback) {
        // Allow server-to-server requests (no origin)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            process.env.CLIENT_URL,
            /https:\/\/project-management-application.*\.vercel\.app$/
        ];

        const isAllowed = allowedOrigins.some(allowed => {
            if (!allowed) return false;
            if (allowed instanceof RegExp) return allowed.test(origin);
            return allowed === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true
}));

// Mount routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/comments', require('./routes/comment.routes'));

// Global error handler
const errorHandler = require('./middleware/error');
app.use(errorHandler);

module.exports = app;