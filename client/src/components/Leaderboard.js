// coders-hangout/client/src/components/Leaderboard.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext'; // For global error/message handling

function Leaderboard() {
    const { setError, setMessage } = useAuth();
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const API_URL = 'https://coders-hangout-backend.onrender.com/api/users/leaderboard'; // Backend leaderboard endpoint

    useEffect(() => {
        const fetchLeaderboard = async () => {
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
                    setLeaderboardData(data);
                } else {
                    setFetchError(data.msg || 'Failed to fetch leaderboard data.');
                }
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
                setFetchError('Network error or server is unreachable.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [setError, setMessage]); // Depend on error/message setters to clear them

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading leaderboard...</p>
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
        <div className="p-4 bg-white rounded-lg shadow-xl max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Top Coders Leaderboard</h2>

            {leaderboardData.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">No users on the leaderboard yet. Start solving challenges!</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider rounded-tl-lg">Rank</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">User</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Points</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider rounded-tr-lg">Challenges Completed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboardData.map((user, index) => (
                                <tr key={user.username || index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 last:border-b-0`}>
                                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{index + 1}</td>
                                    <td className="py-3 px-4 text-sm text-gray-800 flex items-center">
                                        <img
                                            src={user.profilePicture || 'https://placehold.co/40x40/cccccc/ffffff?text=User'}
                                            alt={user.username}
                                            className="w-8 h-8 rounded-full object-cover mr-3 border border-gray-300"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/cccccc/ffffff?text=User'; }}
                                        />
                                        <span className="font-semibold text-blue-700">{user.username}</span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-800 font-bold">{user.points}</td>
                                    <td className="py-3 px-4 text-sm text-gray-800">{user.completedChallenges ? user.completedChallenges.length : 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export { Leaderboard };
