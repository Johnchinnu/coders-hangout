// coders-hangout/server/middleware/auth.js
const jwt = require('jsonwebtoken');

// Load JWT Secret from environment variables
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined for middleware.');
    process.exit(1);
}

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token'); // Conventionally, tokens are sent in 'x-auth-token' header

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, jwtSecret);

        // Add user from payload to request object
        req.user = decoded.user; // decoded.user will contain { id: user._id }
        next(); // Proceed to the next middleware/route handler

    } catch (err) {
        // Token is not valid
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
