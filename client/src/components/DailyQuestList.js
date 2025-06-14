// coders-hangout/client/src/components/DailyQuestList.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function DailyQuestList({ onViewChallenge }) {
    const { setError, setMessage } = useAuth();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const API_URL = 'http://localhost:5000/api/challenges'; // Backend Challenges API endpoint

    useEffect(() => {
        const fetchChallenges = async () => {
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
                    setChallenges(data);
                } else {
                    setFetchError(data.msg || 'Failed to fetch challenges');
                }
            } catch (err) {
                console.error('Error fetching challenges:', err);
                setFetchError('Network error or server is unreachable.');
            } finally {
                setLoading(false);
            }
        };

        fetchChallenges();
    }, [setError, setMessage]); // Depend on error/message setters to clear them

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading challenges...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">{fetchError}</span>
                <p className="text-sm mt-2">Please ensure your backend server is running and accessible and you have seeded some challenges.</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Daily Coding Challenges</h2>
            {challenges.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">No challenges available yet. Check back later!</p>
            ) : (
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
                                <span>Created: {new Date(challenge.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button
                                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 ease-in-out"
                                onClick={() => onViewChallenge(challenge._id)}
                            >
                                Solve Challenge
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export { DailyQuestList };
