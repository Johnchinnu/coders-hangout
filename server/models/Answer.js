// coders-hangout/server/models/Answer.js
const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        minlength: 10 // Minimum length for answer text
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    authorUsername: { // Store username directly for easier display
        type: String,
        required: true
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question', // Reference to the Question model
        required: true
    },
    upvotes: {
        type: Number,
        default: 0
    },
    upvotedBy: [ // New field: Array of User IDs who upvoted this answer
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
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
AnswerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Answer', AnswerSchema);
