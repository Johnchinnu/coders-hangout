// coders-hangout/server/models/Question.js
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 10 // Minimum length for question title
    },
    description: {
        type: String,
        required: true,
        minlength: 20 // Minimum length for question description
    },
    tags: [
        {
            type: String,
            trim: true
        }
    ],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    authorUsername: { // Store username directly for easier display
        type: String,
        required: true
    },
    answers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Answer' // Reference to the Answer model
        }
    ],
    upvotes: {
        type: Number,
        default: 0
    },
    upvotedBy: [ // New field: Array of User IDs who upvoted this question
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    views: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update `updatedAt` on save
QuestionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Question', QuestionSchema);