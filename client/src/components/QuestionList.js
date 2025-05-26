// coders-hangout/client/src/components/QuestionList.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// QuestionList now accepts a prop to handle viewing a specific question
function QuestionList({ onViewQuestion }) {
    const { authToken, setError, setMessage, isAuthenticated } = useAuth(); // Added isAuthenticated
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const API_URL = 'http://localhost:5000/api/questions';

    // Function to fetch questions
    const fetchQuestions = async () => {
        setLoading(true);
        setFetchError(null);
        setError(null); // Clear global auth error
        setMessage(null); // Clear global auth message

        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setQuestions(data);
            } else {
                setFetchError(data.msg || 'Failed to fetch questions');
            }
        } catch (err) {
            console.error('Error fetching questions:', err);
            setFetchError('Network error or server is unreachable.');
        } finally {
            setLoading(false);
        }
    };

    // Function to handle upvoting a question
    const handleUpvoteQuestion = async (questionId) => {
        if (!isAuthenticated) {
            setError('You must be logged in to upvote.');
            return;
        }
        setMessage(null); // Clear previous messages

        try {
            const response = await fetch(`${API_URL}/upvote/${questionId}`, {
                method: 'PUT', // Use PUT for updates
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken, // Send the authentication token
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.msg);
                // Optimistically update the upvote count or re-fetch questions
                setQuestions(prevQuestions =>
                    prevQuestions.map(q =>
                        q._id === questionId ? { ...q, upvotes: data.upvotes } : q
                    )
                );
            } else {
                setError(data.msg || 'Failed to upvote question.');
            }
        } catch (err) {
            console.error('Error upvoting question:', err);
            setError('Network error or server is unreachable.');
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [authToken, setError, setMessage]); // Re-fetch if authToken changes (e.g., after login/logout)

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading questions...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">{fetchError}</span>
                <p className="text-sm mt-2">Please ensure your backend server is running and accessible.</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Recent Questions</h2>
            {questions.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">No questions posted yet. Be the first to ask!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {questions.map((question) => (
                        <div key={question._id} className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out border border-gray-200">
                            <h3 className="text-xl font-semibold text-blue-700 mb-2">{question.title}</h3>
                            <p className="text-gray-700 text-sm mb-3 line-clamp-3">{question.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {question.tags.map((tag, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex justify-between items-center text-gray-500 text-xs mt-4">
                                <span>Asked by <span className="font-medium text-gray-700">{question.authorUsername}</span> on {new Date(question.createdAt).toLocaleDateString()}</span>
                                <span>Views: {question.views}</span>
                            </div>
                            {/* Upvote section */}
                            <div className="flex items-center justify-between mt-4 border-t pt-3 border-gray-200">
                                <span className="text-gray-700 font-bold text-lg flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1-3a1 1 0 00-1 1v.01a1 1 0 002 0V5a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {question.upvotes} Upvotes
                                </span>
                                <button
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full text-sm transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleUpvoteQuestion(question._id)}
                                    disabled={!isAuthenticated} // Disable if not logged in
                                >
                                    Upvote
                                </button>
                            </div>
                            <button
                                className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out"
                                onClick={() => onViewQuestion(question._id)}
                            >
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export { QuestionList };
