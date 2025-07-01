// coders-hangout/server/routes/questions.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');

/**
 * @route   POST /api/questions
 * @desc    Ask a new question
 * @access  Private (requires authentication)
 */
router.post('/', auth, async (req, res) => {
    const { title, description, tags } = req.body;

    try {
        const user = await User.findById(req.user.id).select('username');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const newQuestion = new Question({
            title,
            description,
            tags: Array.isArray(tags) ? tags.map(tag => tag.trim()) : [],
            author: req.user.id,
            authorUsername: user.username
        });

        const question = await newQuestion.save();
        res.status(201).json(question);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/questions
 * @desc    Get all questions with optional search, filter, and pagination
 * @access  Public
 * @query   search (string): Search query for title/description
 * @query   tags (string): Comma-separated tags for filtering
 * @query   page (number): Page number (default 1)
 * @query   limit (number): Number of questions per page (default 10)
 */
router.get('/', async (req, res) => {
    try {
        const { search, tags, page = 1, limit = 10 } = req.query; // Extract query parameters, set defaults
        const skip = (parseInt(page) - 1) * parseInt(limit); // Calculate how many documents to skip

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
            query.tags = { $in: tagsArray.map(tag => new RegExp(tag, 'i')) };
        }

        // Get total count of questions matching the filters (before pagination)
        const totalQuestions = await Question.countDocuments(query);

        const questions = await Question.find(query)
                                      .sort({ createdAt: -1 })
                                      .skip(skip) // Apply skip for pagination
                                      .limit(parseInt(limit)) // Apply limit for pagination
                                      .select('-__v')
                                      .populate('author', 'username');

        res.json({
            questions,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalQuestions / parseInt(limit)),
            totalQuestions
        });
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
                                      .populate('author', 'username')
                                      .populate({
                                          path: 'answers',
                                          populate: { path: 'author', select: 'username' }
                                      })
                                      .select('-__v');

        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        }

        question.views += 1;
        await question.save();

        res.json(question);
    } catch (err) {
        console.error(err.message);
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

        question.answers.unshift(answer.id);
        await question.save();

        res.status(201).json(answer);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Question not found (Invalid ID)' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
