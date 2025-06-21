// coders-hangout/server/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { // User who sent the message
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderUsername: { // Store username directly for easier display
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500 // Limit message length
    },
    // Optional: Could add a 'room' field if you want separate chat rooms
    // room: {
    //     type: String,
    //     default: 'general'
    // },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);
