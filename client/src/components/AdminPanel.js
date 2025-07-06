// coders-hangout/client/src/components/AdminPanel.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminPanel() {
    const { authToken, isAuthenticated, setError, setMessage } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Easy');
    const [pointsAward, setPointsAward] = useState(10);
    const [exampleInput, setExampleInput] = useState('');
    const [exampleOutput, setExampleOutput] = useState('');
    const [expectedOutput, setExpectedOutput] = useState('');
    const [starterCode, setStarterCode] = useState('');
    const [tests, setTests] = useState(''); // JSON string of test cases
    const [tags, setTags] = useState(''); // Comma-separated string of tags

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitMessage, setSubmitMessage] = useState(null);

    const API_URL = 'https://coders-hangout-backend.onrender.com/api/challenges'; // Endpoint for creating challenges

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        setSubmitMessage(null);
        setError(null); // Clear global auth error
        setMessage(null); // Clear global auth message

        if (!isAuthenticated) {
            setSubmitError('You must be logged in to create challenges.');
            setSubmitting(false);
            return;
        }

        let parsedTests = [];
        try {
            // Attempt to parse tests as JSON array
            parsedTests = JSON.parse(tests);
            if (!Array.isArray(parsedTests)) {
                throw new Error('Tests must be a valid JSON array.');
            }
        } catch (err) {
            setSubmitError(`Invalid Tests JSON format: ${err.message}`);
            setSubmitting(false);
            return;
        }

        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        const newChallenge = {
            title,
            description,
            difficulty,
            pointsAward: Number(pointsAward),
            exampleInput,
            exampleOutput,
            expectedOutput,
            starterCode,
            tests: parsedTests,
            tags: tagsArray,
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken, // Send auth token
                },
                body: JSON.stringify(newChallenge),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitMessage('Challenge created successfully!');
                // Clear form fields
                setTitle('');
                setDescription('');
                setDifficulty('Easy');
                setPointsAward(10);
                setExampleInput('');
                setExampleOutput('');
                setExpectedOutput('');
                setStarterCode('');
                setTests('');
                setTags('');
            } else {
                setSubmitError(data.msg || 'Failed to create challenge.');
            }
        } catch (err) {
            console.error('Error creating challenge:', err);
            setSubmitError('Network error or server is unreachable.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-xl max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Admin Panel: Create New Challenge</h2>

            {submitError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline ml-2">{submitError}</span>
                </div>
            )}
            {submitMessage && !submitError && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline ml-2">{submitMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="mb-4">
                    <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                        Challenge Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Implement Fibonacci Sequence"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-y"
                        placeholder="Provide a detailed description of the challenge."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>

                {/* Difficulty and Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="difficulty" className="block text-gray-700 text-sm font-bold mb-2">
                            Difficulty
                        </label>
                        <select
                            id="difficulty"
                            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            required
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="pointsAward" className="block text-gray-700 text-sm font-bold mb-2">
                            Points Award
                        </label>
                        <input
                            type="number"
                            id="pointsAward"
                            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={pointsAward}
                            onChange={(e) => setPointsAward(Number(e.target.value))}
                            min="1"
                            required
                        />
                    </div>
                </div>

                {/* Example Input/Output */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="exampleInput" className="block text-gray-700 text-sm font-bold mb-2">
                            Example Input
                        </label>
                        <textarea
                            id="exampleInput"
                            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-y"
                            placeholder="e.g., 5"
                            value={exampleInput}
                            onChange={(e) => setExampleInput(e.target.value)}
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="exampleOutput" className="block text-gray-700 text-sm font-bold mb-2">
                            Example Output
                        </label>
                        <textarea
                            id="exampleOutput"
                            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-y"
                            placeholder="e.g., 5"
                            value={exampleOutput}
                            onChange={(e) => setExampleOutput(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                {/* Expected Output (for submission validation) */}
                <div className="mb-4">
                    <label htmlFor="expectedOutput" className="block text-gray-700 text-sm font-bold mb-2">
                        Expected Output (for automated testing)
                    </label>
                    <textarea
                        id="expectedOutput"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-y"
                        placeholder="The exact expected output for the given test cases/logic."
                        value={expectedOutput}
                        onChange={(e) => setExpectedOutput(e.target.value)}
                        required
                    ></textarea>
                     <p className="text-xs text-gray-500 mt-1">This is the exact string your solution's output must match.</p>
                </div>

                {/* Starter Code */}
                <div className="mb-4">
                    <label htmlFor="starterCode" className="block text-gray-700 text-sm font-bold mb-2">
                        Starter Code (Optional)
                    </label>
                    <textarea
                        id="starterCode"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-y font-mono text-sm"
                        placeholder="Provide initial code structure (e.g., function signature)."
                        value={starterCode}
                        onChange={(e) => setStarterCode(e.target.value)}
                    ></textarea>
                     <p className="text-xs text-gray-500 mt-1">This code will be pre-filled in the user's editor.</p>
                </div>

                {/* Tests (JSON Array) */}
                <div className="mb-4">
                    <label htmlFor="tests" className="block text-gray-700 text-sm font-bold mb-2">
                        Tests (JSON Array of Objects)
                    </label>
                    <textarea
                        id="tests"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-y font-mono text-sm"
                        placeholder='e.g., [{"input": "5", "expectedOutput": "5"}, {"input": "10", "expectedOutput": "10"}]'
                        value={tests}
                        onChange={(e) => setTests(e.target.value)}
                        required
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">Provide test cases as a JSON array. Each object should have 'input' and 'expectedOutput'.</p>
                </div>

                {/* Tags */}
                <div className="mb-6">
                    <label htmlFor="tags" className="block text-gray-700 text-sm font-bold mb-2">
                        Tags (comma-separated)
                    </label>
                    <input
                        type="text"
                        id="tags"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., algorithms, arrays, dynamic-programming"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate tags with commas.</p>
                </div>

                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting || !isAuthenticated}
                >
                    {submitting ? 'Creating Challenge...' : 'Create Challenge'}
                </button>
            </form>
        </div>
    );
}

export { AdminPanel };
