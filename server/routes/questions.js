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
 * @desc    Get all questions
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const questions = await Question.find()
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

/**
 * @route   PUT /api/questions/upvote/:id
 * @desc    Upvote a question
 * @access  Private
 */
router.put('/upvote/:id', auth, async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        const user = await User.findById(req.user.id);

        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        }
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if the user has already upvoted this question
        if (question.upvotedBy.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Question already upvoted by this user' });
        }

        // Add user to upvotedBy array and increment upvotes
        question.upvotedBy.unshift(req.user.id);
        question.upvotes += 1;

        // Add question to user's upvotedQuestions array
        user.upvotedQuestions.unshift(question.id);

        await question.save();
        await user.save();

        res.json({ msg: 'Question upvoted successfully', upvotes: question.upvotes });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Question or User not found (Invalid ID)' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/questions/answers/upvote/:id
 * @desc    Upvote an answer
 * @access  Private
 */
router.put('/answers/upvote/:id', auth, async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        const user = await User.findById(req.user.id);

        if (!answer) {
            return res.status(404).json({ msg: 'Answer not found' });
        }
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if the user has already upvoted this answer
        if (answer.upvotedBy.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Answer already upvoted by this user' });
        }

        // Add user to upvotedBy array and increment upvotes
        answer.upvotedBy.unshift(req.user.id);
        answer.upvotes += 1;

        // Add answer to user's upvotedAnswers array
        user.upvotedAnswers.unshift(answer.id);

        await answer.save();
        await user.save();

        res.json({ msg: 'Answer upvoted successfully', upvotes: answer.upvotes });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Answer or User not found (Invalid ID)' });
        }
        res.status(500).send('Server Error');
    }
});


// TODO: Implement routes for Downvoting, Editing/Deleting Questions/Answers

module.exports = router;
