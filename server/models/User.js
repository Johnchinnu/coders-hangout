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
    // Existing fields to track upvotes by this user
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
    // NEW: Fields for User Profile and Points System
    points: { // For gamification/XP
        type: Number,
        default: 0
    },
    completedChallenges: [ // Store IDs of challenges user has completed
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Challenge'
        }
    ],
    bio: { // User's personal description
        type: String,
        trim: true,
        maxlength: 500, // Max length for bio
        default: ''
    },
    profilePicture: { // URL to a profile picture (e.g., Gravatar, hosted image)
        type: String,
        default: 'https://placehold.co/150x150/cccccc/ffffff?text=User' // Default placeholder image
    },
    joinedDate: {
        type: Date,
        default: Date.now
    }
});

// Create and export the User model
module.exports = mongoose.model('User', UserSchema);
