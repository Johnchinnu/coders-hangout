// coders-hangout/client/src/components/QuestionList.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

function QuestionList({ onViewQuestion }) {
    const { authToken, setError, setMessage } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // States for immediate input values (for debouncing)
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTags, setFilterTags] = useState('');

    // States for debounced values, which will trigger the API fetch
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [debouncedFilterTags, setDebouncedFilterTags] = useState('');

    // NEW: States for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [questionsPerPage, setQuestionsPerPage] = useState(10); // Default items per page

    const API_BASE_URL = 'http://localhost:5000/api/questions';

    // Debounce effect for searchTerm
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    // Debounce effect for filterTags
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilterTags(filterTags);
        }, 500); // 500ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [filterTags]);


    // Memoized fetchQuestions function, now depending on debounced values and pagination states
    const fetchQuestions = useCallback(async (search = '', tags = '', page = 1, limit = 10) => {
        setLoading(true);
        setFetchError(null);
        setError(null);
        setMessage(null);

        let url = API_BASE_URL;
        const queryParams = [];

        if (search) {
            queryParams.push(`search=${encodeURIComponent(search)}`);
        }
        if (tags) {
            queryParams.push(`tags=${encodeURIComponent(tags)}`);
        }
        // Add pagination parameters
        queryParams.push(`page=${page}`);
        queryParams.push(`limit=${limit}`);

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
                setQuestions(data.questions); // Backend now returns an object with questions array
                setCurrentPage(data.currentPage);
                setTotalPages(data.totalPages);
            } else {
                setFetchError(data.msg || 'Failed to fetch questions');
            }
        } catch (err) {
            console.error('Error fetching questions:', err);
            setFetchError('Network error or server is unreachable.');
        } finally {
            setLoading(false);
        }
    }, [setError, setMessage]);

    // This useEffect will now trigger when debounced search/filter terms or pagination states change
    useEffect(() => {
        fetchQuestions(debouncedSearchTerm, debouncedFilterTags, currentPage, questionsPerPage);
    }, [debouncedSearchTerm, debouncedFilterTags, currentPage, questionsPerPage, fetchQuestions]);


    const handleSearchAndFilter = (e) => {
        e.preventDefault();
        // When the button is clicked, we explicitly update the debounced terms
        // and reset to page 1 for a new search/filter operation.
        setDebouncedSearchTerm(searchTerm);
        setDebouncedFilterTags(filterTags);
        setCurrentPage(1); // Reset to first page on new search/filter
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to top of list for better UX
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterTags('');
        setDebouncedSearchTerm('');
        setDebouncedFilterTags('');
        setCurrentPage(1); // Reset to first page
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
                            type="button"
                            onClick={handleClearFilters}
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
                <>
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

                    {/* Pagination Controls */}
                    <div className="flex justify-center items-center space-x-4 mt-8">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                        >
                            Previous
                        </button>
                        <span className="text-gray-700 font-semibold">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export { QuestionList };
