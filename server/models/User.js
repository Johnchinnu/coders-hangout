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
    // NEW: Role field for access control
    role: {
        type: String,
        enum: ['user', 'admin'], // Restrict to 'user' or 'admin'
        default: 'user' // Default role is 'user'
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
    // New fields to track upvotes by this user
    upvotedQuestions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }
    ],
    upvotedAnswers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Answer'
        }
    ],
    completedChallenges: [ // Track completed challenges by ID
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Challenge'
        }
    ],
    points: { // Total points earned from challenges
        type: Number,
        default: 0
    },
    profilePicture: { // Optional profile picture URL
        type: String,
        default: '' // Can be a URL to an image hosting service or a default avatar
    },
    bio: { // Optional user biography
        type: String,
        trim: true,
        maxlength: 500
    },
    joinedDate: {
        type: Date,
        default: Date.now
    }
});

// Create and export the User model
module.exports = mongoose.model('User', UserSchema);
