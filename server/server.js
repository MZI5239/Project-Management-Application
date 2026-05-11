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
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
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

// ✅ Export app for Vercel serverless
module.exports = app;