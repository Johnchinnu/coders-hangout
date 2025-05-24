// coders-hangout/server/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // dotenv is required here
const cors = require('cors');

// Load environment variables from .env file FIRST
dotenv.config();

// --- DEBUGGING LINE (now after dotenv.config()) ---
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO', process.env.JWT_SECRET);
// --- END DEBUGGING LINE ---

const authRoutes = require('./routes/auth'); // Now authRoutes is required after dotenv.config()

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Coders Hangout Backend API is running!');
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
