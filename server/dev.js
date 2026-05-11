// server/dev.js  <-- use this locally only
const http = require('http');
const socketio = require('socket.io');
const app = require('./server');
const dotenv = require('dotenv');

dotenv.config();

const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});

global.io = io;

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join-board', (boardId) => {
        socket.join(boardId);
    });
    socket.on('join-task', (taskId) => {
        socket.join(taskId);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dev server running on port ${PORT}`);
});