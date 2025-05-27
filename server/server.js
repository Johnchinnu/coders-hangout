// coders-hangout/server/server.js
const express = require('express');
const mongoose = require('mongoose'); // Import mongoose
const dotenv = require('dotenv'); // Import dotenv
const cors = require('cors'); // Import cors middleware
const path = require('path'); // Import path for serving static assets

// Load environment variables from .env file FIRST
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ extended: false })); // Allows us to get data in req.body

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Basic API Route (can be removed later or kept for health check)
app.get('/', (req, res) => {
    res.send('Coders Hangout Backend API is running!');
});

// Define Routes
app.use('/api/auth', require('./routes/auth')); // Authentication routes
app.use('/api/questions', require('./routes/questions')); // Q&A board routes
app.use('/api/execute-code', require('./routes/executeCode')); // New: Code execution route

// For production, serve static assets
// This block is typically used when deploying the backend to serve the frontend build
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static('client/build'));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
