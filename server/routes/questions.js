// coders-hangout/server/routes/questions.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import our auth middleware
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User'); // To fetch username for authorUsername

/**
 * @route   POST /api/questions
 * @desc    Ask a new question
 * @access  Private (requires authentication)
 */
router.post('/', auth, async (req, res) => {
    const { title, description, tags } = req.body;

    try {
        // Get author's username from the database using req.user.id
        const user = await User.findById(req.user.id).select('username');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const newQuestion = new Question({
            title,
            description,
            tags: Array.isArray(tags) ? tags.map(tag => tag.trim()) : [],
            author: req.user.id,
            authorUsername: user.username // Store username directly
        });

        const question = await newQuestion.save();
        res.status(201).json(question); // 201 Created
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/questions
 * @desc    Get all questions with optional search and filter
 * @access  Public
 * @query   search (string): Search query for title/description
 * @query   tags (string): Comma-separated tags for filtering
 */
router.get('/', async (req, res) => {
    try {
        const { search, tags } = req.query; // Extract query parameters
        let query = {};

        // Search by title or description (case-insensitive regex)
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by tags
        if (tags) {
            const tagsArray = tags.split(',').map(tag => tag.trim());
            // Use $in to find documents where the 'tags' array contains any of the provided tags
            query.tags = { $in: tagsArray.map(tag => new RegExp(tag, 'i')) }; // Case-insensitive tag search
        }

        const questions = await Question.find(query)
                                      .sort({ createdAt: -1 }) // Sort by newest first
                                      .select('-__v') // Exclude __v field
                                      .populate('author', 'username'); // Populate author with username

        res.json(questions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/questions/:id
 * @desc    Get question by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
                                      .populate('author', 'username') // Populate author
                                      .populate({
                                          path: 'answers',
                                          populate: { path: 'author', select: 'username' } // Populate answers' authors
                                      })
                                      .select('-__v');

        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        }

        // Increment view count (optional, but good for Q&A)
        question.views += 1;
        await question.save();

        res.json(question);
    } catch (err) {
        console.error(err.message);
        // Check for invalid ObjectId format
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Question not found (Invalid ID)' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/questions/:id/answers
 * @desc    Add an answer to a question
 * @access  Private
 */
router.post('/:id/answers', auth, async (req, res) => {
    const { text } = req.body;

    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        }

        // Get author's username
        const user = await User.findById(req.user.id).select('username');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const newAnswer = new Answer({
            text,
            author: req.user.id,
            authorUsername: user.username,
            question: req.params.id
        });

        const answer = await newAnswer.save();

        // Add the answer's ID to the question's answers array
        question.answers.unshift(answer.id); // Add to the beginning
        await question.save();

        res.status(201).json(answer); // 201 Created
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Question not found (Invalid ID)' });
        }
        res.status(500).send('Server Error');
    }
});

// TODO: Implement routes for Upvoting/Downvoting, Editing/Deleting Questions/Answers

module.exports = router;
