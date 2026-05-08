const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Fallback for JWT_SECRET if not provided in env
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'taskflow_dev_secret_key_12345';
    console.warn('WARNING: JWT_SECRET not found in environment. Using default development secret.');
}

const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});

// Global io object
global.io = io;

// Body parser
app.use(express.json());
app.use(cookieParser());

// Security middlewares
app.use(helmet({
    contentSecurityPolicy: false // Disable CSP for local development/Vite
}));
app.use(cors({
    origin: process.env.CLIENT_URL,
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

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join-board', (boardId) => {
        socket.join(boardId);
        console.log(`User joined board: ${boardId}`);
    });

    socket.on('join-task', (taskId) => {
        socket.join(taskId);
        console.log(`User joined task room: ${taskId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Port configuration
const PORT = process.env.PORT || 3000;

// Vite middleware integration for production and development
async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = require('vite');
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
