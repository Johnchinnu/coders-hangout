// coders-hangout/server/routes/challenges.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // For protecting some routes
const Challenge = require('../models/Challenge');
const User = require('../models/User'); // Import User model to update points/completed challenges
const { exec } = require('child_process'); // For code execution
const path = require('path');
const fs = require('fs');
const util = require('util'); // Import util for promisify

const execPromise = util.promisify(exec);

/**
 * @route   POST /api/challenges
 * @desc    Create a new coding challenge (Admin route - for testing, can be private)
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    const { title, description, difficulty, exampleInput, exampleOutput, expectedOutput, starterCode, tests, pointsAward } = req.body;

    try {
        const newChallenge = new Challenge({
            title,
            description,
            difficulty,
            exampleInput,
            exampleOutput,
            expectedOutput,
            starterCode,
            tests,
            pointsAward: pointsAward || 10 // Use provided pointsAward or default to 10
        });

        const challenge = await newChallenge.save();
        res.status(201).json(challenge); // 201 Created
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/challenges
 * @desc    Get all coding challenges
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ createdAt: -1 });
        res.json(challenges);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/challenges/:id
 * @desc    Get a single coding challenge by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) {
            return res.status(404).json({ msg: 'Challenge not found' });
        }
        res.json(challenge);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Challenge not found (Invalid ID)' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/challenges/:id/submit
 * @desc    Submit code for a challenge, run it, and check against expected output.
 * Award points if correct and not already completed.
 * @access  Private
 * IMPORTANT: This still uses child_process.exec, which is NOT secure for untrusted input in production.
 */
router.post('/:id/submit', auth, async (req, res) => {
    const { code, language } = req.body;
    const challengeId = req.params.id;
    const userId = req.user.id;

    if (!code || !language) {
        return res.status(400).json({ msg: 'Code and language are required.' });
    }

    let tempFilePath = '';
    let compiledFilePath = '';
    let executablePath = '';
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const tempDir = path.join(__dirname, '../temp');
    const timeout = 5000; // 5 seconds for execution

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    try {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ msg: 'Challenge not found.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Check if user has already completed this challenge
        if (user.completedChallenges.includes(challengeId)) {
            return res.status(400).json({ msg: 'Challenge already completed by this user.', success: false });
        }

        let command = '';
        let initialCode = code;
        let executionOutput = '';
        let executionError = '';

        // --- Code Execution Logic (similar to executeCode.js) ---
        if (language === 'javascript') {
            tempFilePath = path.join(tempDir, `${uniqueId}.js`);
            fs.writeFileSync(tempFilePath, initialCode);
            command = `node ${tempFilePath}`;
        } else if (language === 'python') {
            tempFilePath = path.join(tempDir, `${uniqueId}.py`);
            fs.writeFileSync(tempFilePath, initialCode);
            command = `python ${tempFilePath}`;
        } else if (language === 'java') {
            const className = 'Solution';
            tempFilePath = path.join(tempDir, `${className}.java`);
            compiledFilePath = path.join(tempDir, `${className}.class`);
            if (!initialCode.includes(`public class ${className}`)) {
                initialCode = `
public class ${className} {
    public static void main(String[] args) {
        // Your code goes here
        ${initialCode}
    }
}
                `;
            }
            fs.writeFileSync(tempFilePath, initialCode);
            try {
                await execPromise(`javac ${tempFilePath}`, { timeout });
            } catch (compileErr) {
                return res.status(400).json({ output: compileErr.stderr || compileErr.message, error: 'Compilation Error (Java)', success: false });
            }
            command = `java -cp ${tempDir} ${className}`;
        } else if (language === 'cpp') {
            tempFilePath = path.join(tempDir, `${uniqueId}.cpp`);
            executablePath = path.join(tempDir, `${uniqueId}.out`);
            fs.writeFileSync(tempFilePath, initialCode);
            try {
                await execPromise(`g++ ${tempFilePath} -o ${executablePath}`, { timeout });
            } catch (compileErr) {
                return res.status(400).json({ output: compileErr.stderr || compileErr.message, error: 'Compilation Error (C++)', success: false });
            }
            command = `${executablePath}`;
        } else {
            return res.status(400).json({ msg: 'Unsupported language for execution.', success: false });
        }

        // Execute the command
        try {
            const { stdout, stderr } = await execPromise(command, { timeout });
            executionOutput = stdout;
            executionError = stderr;
        } catch (execErr) {
            executionOutput = execErr.stdout; // Standard output even if there's an error
            executionError = execErr.stderr || execErr.message;
            if (execErr.killed && execErr.signal === 'SIGTERM') {
                executionError = `Execution timed out (${timeout / 1000} seconds limit). Possible infinite loop or long running code.`;
            }
        }
        // --- End Code Execution Logic ---

        // If there's an execution error (stderr or timeout)
        if (executionError) {
            return res.status(400).json({ output: executionOutput, error: executionError, success: false });
        }

        // Trim outputs for comparison
        const userOutput = executionOutput.trim();
        const expectedOutput = challenge.expectedOutput.trim();

        if (userOutput === expectedOutput) {
            // Solution is correct! Award points and mark challenge as completed
            user.points += challenge.pointsAward;
            user.completedChallenges.unshift(challengeId); // Add to the beginning
            await user.save();

            res.json({
                msg: `Solution Accepted! You earned ${challenge.pointsAward} points!`,
                output: executionOutput,
                success: true,
                userPoints: user.points,
                userCompletedChallenges: user.completedChallenges.length
            });
        } else {
            res.status(400).json({
                msg: 'Solution Incorrect. Your output does not match the expected output.',
                output: executionOutput,
                expectedOutput: expectedOutput,
                success: false
            });
        }

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Challenge or User not found (Invalid ID)', success: false });
        }
        res.status(500).send({ msg: 'Server Error during submission process.', error: err.message, success: false });
    } finally {
        // Clean up all temporary files created during this request
        const filesToDelete = [tempFilePath, compiledFilePath, executablePath];
        filesToDelete.forEach(file => {
            if (file && fs.existsSync(file)) {
                try {
                    fs.unlinkSync(file);
                } catch (cleanupErr) {
                    console.error(`Error deleting temp file ${file}:`, cleanupErr.message);
                }
            }
        });
        if (language === 'java' && compiledFilePath && fs.existsSync(compiledFilePath)) {
            try {
                fs.unlinkSync(compiledFilePath); // Ensure Java class file is also deleted
            } catch (cleanupErr) {
                console.error(`Error deleting Java class file ${compiledFilePath}:`, cleanupErr.message);
            }
        }
    }
});

module.exports = router;
