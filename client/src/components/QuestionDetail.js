// coders-hangout/client/src/components/QuestionDetail.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function QuestionDetail({ questionId, onBackToList }) {
    const { authToken, isAuthenticated, setError, setMessage } = useAuth(); // Added isAuthenticated
    const [question, setQuestion] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [answerText, setAnswerText] = useState('');
    const [submittingAnswer, setSubmittingAnswer] = useState(false);
    const [answerError, setAnswerError] = useState(null);
    const [answerMessage, setAnswerMessage] = useState(null);

    const API_BASE_URL = 'https://coders-hangout-backend.onrender.com/api/questions';

    // Function to fetch question details
    const fetchQuestionDetails = async () => {
        setFetchLoading(true);
        setFetchError(null);
        setError(null); // Clear global auth errors
        setMessage(null); // Clear global auth messages
        try {
            const response = await fetch(`${API_BASE_URL}/${questionId}`);
            const data = await response.json();

            if (response.ok) {
                setQuestion(data);
            } else {
                setFetchError(data.msg || 'Failed to load question details.');
            }
        } catch (err) {
            console.error('Error fetching question details:', err);
            setFetchError('Network error or server is unreachable.');
        } finally {
            setFetchLoading(false);
        }
    };

    // Handle answer submission
    const handleAnswerSubmit = async (e) => {
        e.preventDefault();
        setSubmittingAnswer(true);
        setAnswerError(null);
        setAnswerMessage(null);

        if (!answerText.trim()) {
            setAnswerError('Answer cannot be empty.');
            setSubmittingAnswer(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${questionId}/answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken, // Authentication required
                },
                body: JSON.stringify({ text: answerText }),
            });

            const data = await response.json();

            if (response.ok) {
                setAnswerMessage('Answer posted successfully!');
                setAnswerText(''); // Clear the input field
                fetchQuestionDetails(); // Re-fetch question to show new answer
            } else {
                setAnswerError(data.msg || 'Failed to post answer.');
            }
        } catch (err) {
            console.error('Error posting answer:', err);
            setAnswerError('Network error or server is unreachable.');
        } finally {
            setSubmittingAnswer(false);
        }
    };

    // Function to handle upvoting a question
    const handleUpvoteQuestion = async () => {
        if (!isAuthenticated) {
            setError('You must be logged in to upvote.');
            return;
        }
        setMessage(null); // Clear previous messages

        try {
            const response = await fetch(`${API_BASE_URL}/upvote/${questionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.msg);
                setQuestion(prevQuestion => ({
                    ...prevQuestion,
                    upvotes: data.upvotes
                }));
            } else {
                setError(data.msg || 'Failed to upvote question.');
            }
        } catch (err) {
            console.error('Error upvoting question:', err);
            setError('Network error or server is unreachable.');
        }
    };

    // Function to handle upvoting an answer
    const handleUpvoteAnswer = async (answerId) => {
        if (!isAuthenticated) {
            setError('You must be logged in to upvote.');
            return;
        }
        setMessage(null); // Clear previous messages

        try {
            const response = await fetch(`${API_BASE_URL}/answers/upvote/${answerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.msg);
                // Optimistically update the specific answer's upvote count
                setQuestion(prevQuestion => ({
                    ...prevQuestion,
                    answers: prevQuestion.answers.map(ans =>
                        ans._id === answerId ? { ...ans, upvotes: data.upvotes } : ans
                    )
                }));
            } else {
                setError(data.msg || 'Failed to upvote answer.');
            }
        } catch (err) {
            console.error('Error upvoting answer:', err);
            setError('Network error or server is unreachable.');
        }
    };

    useEffect(() => {
        if (questionId) {
            fetchQuestionDetails();
        }
    }, [questionId]);

    if (fetchLoading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading question...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">{fetchError}</span>
                <p className="text-sm mt-2">Could not load question details. Please try again.</p>
                <button
                    onClick={onBackToList}
                    className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                    Back to Questions
                </button>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="text-center py-8 text-gray-600">
                <p>Question not found.</p>
                <button
                    onClick={onBackToList}
                    className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                    Back to Questions
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow-xl">
            <button
                onClick={onBackToList}
                className="mb-6 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
            >
                &larr; Back to Questions
            </button>

            {/* Question Details */}
            <div className="mb-8 border-b pb-6 border-gray-200">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">{question.title}</h2>
                <p className="text-gray-700 text-lg mb-4 leading-relaxed">{question.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="flex justify-between items-center text-gray-500 text-sm mt-4">
                    <span>Asked by <span className="font-semibold text-gray-700">{question.authorUsername}</span> on {new Date(question.createdAt).toLocaleDateString()}</span>
                    <span>Views: {question.views}</span>
                </div>
                {/* Upvote section for Question */}
                <div className="flex items-center justify-between mt-4 border-t pt-3 border-gray-200">
                    <span className="text-gray-700 font-bold text-lg flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1-3a1 1 0 00-1 1v.01a1 1 0 002 0V5a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {question.upvotes} Upvotes
                    </span>
                    <button
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full text-sm transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleUpvoteQuestion}
                        disabled={!isAuthenticated} // Disable if not logged in
                    >
                        Upvote Question
                    </button>
                </div>
            </div>

            {/* Answers Section */}
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Answers ({question.answers.length})</h3>
            {answerMessage && !answerError && ( // Show message only if no error
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline ml-2">{answerMessage}</span>
                </div>
            )}
            {question.answers.length === 0 ? (
                <p className="text-gray-600 mb-6">No answers yet. Be the first to help!</p>
            ) : (
                <div className="space-y-6 mb-8">
                    {question.answers.map((answer) => (
                        <div key={answer._id} className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-200">
                            <p className="text-gray-800 mb-3 leading-relaxed">{answer.text}</p>
                            <div className="flex justify-between items-center text-gray-500 text-xs mt-4 border-t pt-3 border-gray-200">
                                <span>Answered by <span className="font-semibold text-gray-700">{answer.authorUsername}</span> on {new Date(answer.createdAt).toLocaleDateString()}</span>
                                {/* Upvote section for Answer */}
                                <span className="text-gray-700 font-bold text-base flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1-3a1 1 0 00-1 1v.01a1 1 0 002 0V5a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {answer.upvotes} Upvotes
                                </span>
                                <button
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full text-sm transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleUpvoteAnswer(answer._id)}
                                    disabled={!isAuthenticated} // Disable if not logged in
                                >
                                    Upvote Answer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Answer Submission Form */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Answer</h3>
                {answerError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline ml-2">{answerError}</span>
                    </div>
                )}
                {answerMessage && !answerError && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <strong className="font-bold">Success!</strong>
                        <span className="block sm:inline ml-2">{answerMessage}</span>
                    </div>
                )}
                <form onSubmit={handleAnswerSubmit}>
                    <div className="mb-4">
                        <textarea
                            id="answer"
                            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out h-32 resize-y"
                            placeholder="Type your answer here..."
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={submittingAnswer || !isAuthenticated} // Disable if not logged in
                    >
                        {submittingAnswer ? 'Submitting...' : 'Post Your Answer'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export { QuestionDetail };
