// coders-hangout/server/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

// Load environment variables from .env file FIRST
dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));



// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/execute-code', require('./routes/executeCode'));
app.use('/api/challenges', require('./routes/challenges'));

// Socket.IO Middleware for Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error: No token provided.'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded.user;
        next();
    } catch (err) {
        console.error('Socket.IO Auth Error:', err.message); // Log auth errors
        return next(new Error('Authentication error: Invalid token.'));
    }
});


// Socket.IO connection handling
io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Fetch and send chat history to the newly connected client
    try {
        const messages = await Message.find()
                                      .sort({ createdAt: 1 })
                                      .limit(50)
                                      .populate('sender', 'username')
                                      .select('-__v');

        const history = messages.map(msg => ({
            id: msg._id,
            sender: msg.sender ? msg.sender.username : 'Unknown User',
            text: msg.text,
            createdAt: msg.createdAt
        }));

        socket.emit('chat history', history);
    } catch (err) {
        console.error('Error fetching chat history:', err.message);
        socket.emit('chat error', 'Failed to load chat history.');
    }


    // Listen for 'chat message' event from client
    socket.on('chat message', async (msgText) => {
        console.log(`Received message from ${socket.user.username}: "${msgText}"`); // Debug log

        if (!socket.user) {
            socket.emit('chat error', 'Authentication required to send message.');
            return;
        }

        try {
            // Ensure message text is not empty or just whitespace before saving
            if (!msgText || msgText.trim().length === 0) {
                console.warn('Attempted to save empty message from:', socket.user.username);
                socket.emit('chat error', 'Message cannot be empty.');
                return;
            }

            const newMessage = new Message({
                sender: socket.user.id,
                senderUsername: socket.user.username,
                text: msgText // Use the raw msgText here, trim if needed by schema (already done by schema)
            });

            console.log('Attempting to save message:', newMessage); // Debug log before saving
            await newMessage.save(); // Save message to DB
            console.log('Message saved successfully:', newMessage._id); // Debug log after saving

            io.emit('chat message', {
                id: newMessage._id,
                sender: newMessage.senderUsername,
                text: newMessage.text,
                createdAt: newMessage.createdAt
            });
        } catch (err) {
            console.error('Error saving or broadcasting message:', err.message);
            // If it's a Mongoose validation error, provide more specific feedback
            if (err.name === 'ValidationError') {
                 socket.emit('chat error', `Validation Error: ${err.message}`);
            } else {
                 socket.emit('chat error', 'Failed to send message.');
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user ? socket.user.username : 'Unknown'} (${socket.id})`);
    });
});


// For production, serve static assets


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io, server };
