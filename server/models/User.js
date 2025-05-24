// coders-hangout/server/models/User.js
const mongoose = require('mongoose');

// Define the User Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Remove whitespace from both ends of a string
        minlength: 3 // Minimum length for username
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // Store emails in lowercase
        match: [/.+@.+\..+/, 'Please fill a valid email address'] // Basic email validation
    },
    password: {
        type: String,
        required: true,
        minlength: 6 // Minimum length for password
    },
    // Optional fields for Coders Hangout features
    xp: {
        type: Number,
        default: 0
    },
    questsCompleted: {
        type: Number,
        default: 0
    },
    streak: {
        type: Number,
        default: 0
    },
    joinedDate: {
        type: Date,
        default: Date.now
    }
});

// Create and export the User model
module.exports = mongoose.model('User', UserSchema);
