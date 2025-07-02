// coders-hangout/client/src/components/DailyQuestList.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

function DailyQuestList({ onViewChallenge }) {
    const { authToken, setError, setMessage } = useAuth();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // NEW: States for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [challengesPerPage, setChallengesPerPage] = useState(10); // Default items per page

    const API_BASE_URL = 'http://localhost:5000/api/challenges';

    // Memoized fetchChallenges function, now including pagination parameters
    const fetchChallenges = useCallback(async (page = 1, limit = 10) => {
        setLoading(true);
        setFetchError(null);
        setError(null); // Clear global auth error
        setMessage(null); // Clear global auth message

        let url = `${API_BASE_URL}?page=${page}&limit=${limit}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setChallenges(data.challenges); // Backend now returns an object with challenges array
                setCurrentPage(data.currentPage);
                setTotalPages(data.totalPages);
            } else {
                setFetchError(data.msg || 'Failed to fetch challenges.');
            }
        } catch (err) {
            console.error('Error fetching challenges:', err);
            setFetchError('Network error or server is unreachable.');
        } finally {
            setLoading(false);
        }
    }, [setError, setMessage]); // Dependencies for useCallback

    // Initial fetch on component mount and when pagination states change
    useEffect(() => {
        fetchChallenges(currentPage, challengesPerPage);
    }, [currentPage, challengesPerPage, fetchChallenges]); // Now depends on currentPage and challengesPerPage

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to top of list for better UX
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading daily quests...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">{fetchError}</span>
                <p className="text-sm mt-2">Could not load daily quests. Please ensure your backend server is running and accessible.</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Daily Quests</h2>

            {challenges.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">No challenges available yet. Check back later!</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {challenges.map((challenge) => (
                            <div key={challenge._id} className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out border border-gray-200">
                                <h3 className="text-xl font-semibold text-blue-700 mb-2">{challenge.title}</h3>
                                <p className="text-gray-700 text-sm mb-3 line-clamp-3">{challenge.description}</p>
                                <div className="flex justify-between items-center text-gray-500 text-xs mt-4">
                                    <span className={`font-medium ${
                                        challenge.difficulty === 'Easy' ? 'text-green-600' :
                                        challenge.difficulty === 'Medium' ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                        Difficulty: {challenge.difficulty}
                                    </span>
                                    <span>Points: <span className="font-medium text-purple-700">{challenge.pointsAward}</span></span>
                                </div>
                                <button
                                    className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out"
                                    onClick={() => onViewChallenge(challenge._id)}
                                >
                                    Solve Challenge
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

export { DailyQuestList };
