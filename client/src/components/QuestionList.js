// coders-hangout/client/src/components/QuestionList.js
import React, { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { useAuth } from '../context/AuthContext';

function QuestionList({ onViewQuestion }) {
    const { authToken, setError, setMessage } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // New states for search and filter
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTags, setFilterTags] = useState(''); // Comma-separated string of tags

    const API_BASE_URL = 'http://localhost:5000/api/questions';

    // useCallback to memoize the fetchQuestions function to avoid unnecessary re-renders
    // and infinite loops in useEffect. It now takes search and tags as arguments.
    const fetchQuestions = useCallback(async (search = '', tags = '') => {
        setLoading(true);
        setFetchError(null);
        setError(null); // Clear global auth error
        setMessage(null); // Clear global auth message

        let url = API_BASE_URL;
        const queryParams = [];

        if (search) {
            queryParams.push(`search=${encodeURIComponent(search)}`);
        }
        if (tags) {
            queryParams.push(`tags=${encodeURIComponent(tags)}`);
        }

        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }

        try {
            const response = await fetch(url, {
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
    }, [setError, setMessage]); // Dependencies for useCallback

    // Initial fetch on component mount and when search/filter parameters change
    useEffect(() => {
        fetchQuestions(searchTerm, filterTags);
    }, [searchTerm, filterTags, fetchQuestions]); // Now depends on searchTerm, filterTags and fetchQuestions

    const handleSearchAndFilter = (e) => {
        e.preventDefault();
        // The useEffect above will trigger automatically when searchTerm or filterTags change
        // No explicit fetch call needed here, just update the states
    };

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
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Q&A Board</h2>

            {/* Search and Filter Section */}
            <div className="bg-gray-100 p-6 rounded-lg shadow-inner mb-6">
                <form onSubmit={handleSearchAndFilter} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label htmlFor="search" className="block text-gray-700 text-sm font-bold mb-2">
                            Search (Title/Description):
                        </label>
                        <input
                            type="text"
                            id="search"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., react hooks, python error"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="filter-tags" className="block text-gray-700 text-sm font-bold mb-2">
                            Filter by Tags (comma-separated):
                        </label>
                        <input
                            type="text"
                            id="filter-tags"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., javascript, css"
                            value={filterTags}
                            onChange={(e) => setFilterTags(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-center mt-2">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            Search & Filter
                        </button>
                         <button
                            type="button" // Use type="button" to prevent form submission
                            onClick={() => {
                                setSearchTerm('');
                                setFilterTags('');
                                // The useEffect will re-fetch automatically
                            }}
                            className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Clear Filters
                        </button>
                    </div>
                </form>
            </div>


            {questions.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">No questions found matching your criteria. Try adjusting your search/filters!</p>
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
                                <span>Asked by <span className="font-medium text-gray-700">{question.authorUsername}</span></span>
                                <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500 text-xs mt-2">
                                <span>Answers: {question.answers.length}</span>
                                <span>Views: {question.views}</span>
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
