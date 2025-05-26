// coders-hangout/server/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file FIRST
dotenv.config();

// --- DEBUGGING LINE (keep for now, remove later) ---
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO', process.env.JWT_SECRET);
// --- END DEBUGGING LINE ---

// Import routes
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions'); // Import question routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Basic API Route (can be removed later or kept for health check)
app.get('/', (req, res) => {
    res.send('Coders Hangout Backend API is running!');
});

// Use routes
app.use('/api/auth', authRoutes); // Auth routes
app.use('/api/questions', questionRoutes); // Q&A routes

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
