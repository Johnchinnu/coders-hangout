// coders-hangout/server/models/Challenge.js
const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5
    },
    description: {
        type: String,
        required: true,
        minlength: 20
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Easy'
    },
    exampleInput: {
        type: String,
        default: ''
    },
    exampleOutput: {
        type: String,
        default: ''
    },
    expectedOutput: {
        type: String,
        required: true
    },
    starterCode: {
        javascript: { type: String, default: '' },
        python: { type: String, default: '' },
        java: { type: String, default: '' },
        cpp: { type: String, default: '' }
    },
    tests: [
        {
            input: { type: String },
            output: { type: String }
        }
    ],
    pointsAward: { // NEW: Points awarded for completing this challenge
        type: Number,
        default: 10 // Default points for a challenge
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
