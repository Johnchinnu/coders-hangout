// coders-hangout/server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For creating tokens
const User = require('../models/User'); // Import the User model

// Load JWT Secret from environment variables
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1); // Exit the process if secret is not defined
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Check if user already exists by email
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // 2. Check if username is already taken
        user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'Username is already taken' });
        }

        // 3. Create a new user instance
        user = new User({
            username,
            email,
            password,
            role: 'user' // Default new users to 'user' role
        });

        // 4. Hash password
        const salt = await bcrypt.genSalt(10); // Generate a salt
        user.password = await bcrypt.hash(password, salt); // Hash the password with the salt

        // 5. Save user to database
        await user.save();

        // 6. Create JWT payload - NOW INCLUDING USERNAME AND ROLE
        const payload = {
            user: {
                id: user.id,
                username: user.username, // Include username
                role: user.role // Include role
            }
        };

        // 7. Sign the JWT token
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ msg: 'User registered successfully', token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error during registration.' }); // Ensure JSON response
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user exists by email
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 2. Compare provided password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 3. Create JWT payload - NOW INCLUDING USERNAME AND ROLE
        const payload = {
            user: {
                id: user.id,
                username: user.username, // Include username
                role: user.role // Include role
            }
        };

        // 4. Sign the JWT token
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.json({ msg: 'Logged in successfully', token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error during login.' }); // Ensure JSON response
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get authenticated user's profile (for token validation/refresh)
 * @access  Private
 */
const auth = require('../middleware/auth'); // Ensure auth middleware is imported here if not already
router.get('/me', auth, async (req, res) => {
    try {
        // req.user is populated by the auth middleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});


module.exports = router;
