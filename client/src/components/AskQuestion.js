// coders-hangout/client/src/components/AskQuestion.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // To get the token for authenticated requests

function AskQuestion({ onQuestionPosted }) {
    const { authToken, loading, error, message, setError, setMessage } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState(''); // Comma-separated string of tags

    const API_URL = 'https://coders-hangout-backend.onrender.com/api/questions'; // Backend Q&A API endpoint

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setMessage(null); // Clear previous messages

        // Convert comma-separated tags string to an array
        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken, // Send the authentication token
                },
                body: JSON.stringify({ title, description, tags: tagsArray }),
            });

            const data = await response.json(); // Always attempt to parse JSON

            if (response.ok) {
                setMessage('Question posted successfully!');
                setTitle('');
                setDescription('');
                setTags('');
                if (onQuestionPosted) {
                    onQuestionPosted(); // Callback to switch to questions list or refresh
                }
            } else {
                // NEW: Improved error handling
                // Check if the error is a Mongoose validation error
                if (data.msg && typeof data.msg === 'string' && data.msg.includes('validation failed')) {
                    // Extract specific validation messages if available
                    const validationErrors = Object.values(data.errors || {})
                                                   .map(err => err.message)
                                                   .join(', ');
                    setError(`Validation Error: ${validationErrors || data.msg}`);
                } else {
                    setError(data.msg || 'Failed to post question. Please try again.');
                }
            }
        } catch (err) {
            console.error('Error posting question:', err);
            // Check if the error is due to JSON parsing (e.g., if backend sends plain text)
            if (err instanceof SyntaxError && err.message.includes('JSON')) {
                setError('Received non-JSON response from server. Backend error.');
            } else {
                setError('Network error or server is unreachable. Please check your backend.');
            }
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Ask a New Question</h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}
            {message && !error && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline ml-2">{message}</span>
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                        Question Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                        placeholder="e.g., How to implement a binary search tree in Python? (Min 10 chars)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out h-32 resize-y"
                        placeholder="Provide detailed context, what you've tried, and any error messages. (Min 20 chars)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>
                <div className="mb-6">
                    <label htmlFor="tags" className="block text-gray-700 text-sm font-bold mb-2">
                        Tags (comma-separated)
                    </label>
                    <input
                        type="text"
                        id="tags"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                        placeholder="e.g., javascript, react, frontend, css"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate tags with commas (e.g., python, algorithms)</p>
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? 'Posting...' : 'Post Question'}
                </button>
            </form>
        </div>
    );
}

export { AskQuestion };
