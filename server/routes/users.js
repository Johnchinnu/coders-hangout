// coders-hangout/server/routes/users.js
const express = require('express');
const router = express.Router(); // Corrected: Only one declaration for router
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

        res.json({ msg: 'Profile updated successfully', user });

    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) { // Duplicate key error (for unique fields like username/email)
            return res.status(400).json({ msg: 'Username or Email already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/users/leaderboard
 * @desc    Get top users by points
 * @access  Public
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await User.find()
                                      .sort({ points: -1 }) // Sort by points in descending order
                                      .limit(10) // Get top 10 users
                                      .select('username points profilePicture completedChallenges -_id'); // Select only necessary fields

        res.json(leaderboard);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
