// coders-hangout/server/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import User model
const auth = require('../middleware/auth'); // Import auth middleware
const bcrypt = require('bcryptjs'); // For password hashing (if updating password)
const jwt = require('jsonwebtoken'); // If you want to issue new token on profile update

// Load JWT Secret from environment variables (redundant if using auth.js's check, but good practice)
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined for user routes.');
    process.exit(1);
}

/**
 * @route   GET /api/users/profile
 * @desc    Get current authenticated user's profile
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
    try {
        // req.user.id comes from the auth middleware
        const user = await User.findById(req.user.id).select('-password -__v'); // Exclude password and __v
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current authenticated user's profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
    const { username, email, bio, profilePicture, password } = req.body;

    // Build user fields object
    const userFields = {};
    if (username) userFields.username = username;
    if (email) userFields.email = email;
    if (bio) userFields.bio = bio;
    if (profilePicture) userFields.profilePicture = profilePicture;

    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Handle password update separately if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        // Update other fields
        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: userFields },
            { new: true, runValidators: true, select: '-password -__v' } // Return new doc, run schema validators, exclude password
        );

        // Optionally, if username or email changes, you might want to re-issue JWT
        // For simplicity, we're not doing that here unless specifically requested.

        res.json({ msg: 'Profile updated successfully', user });

    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) { // Duplicate key error (for unique fields like username/email)
            return res.status(400).json({ msg: 'Username or Email already exists.' });
        }
        res.status(500).send('Server Error');
    }
});


// Note: The /api/users/register route for user creation is handled in auth.js.
// This users.js is for getting/updating user-specific data.
// In a real app, you might have separate routes for admin to manage all users.

module.exports = router;
