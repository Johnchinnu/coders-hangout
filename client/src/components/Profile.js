// client/src/components/Profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // To get authToken and user-related messages

function Profile() {
    const { authToken, isAuthenticated, setError, setMessage } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode

    // Form states for editing
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const API_URL = 'https://coders-hangout-backend.onrender.com/api/users/profile'; // Backend profile endpoint

    // Function to fetch user profile data
    const fetchUserProfile = async () => {
        if (!isAuthenticated) {
            setFetchError('Please log in to view your profile.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setFetchError(null);
        setError(null); // Clear global auth errors
        setMessage(null); // Clear global auth messages

        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken, // Send authentication token
                },
            });

            const data = await response.json();

            if (response.ok) {
                setUserData(data);
                // Populate edit form fields when data is fetched
                setUsername(data.username);
                setEmail(data.email);
                setBio(data.bio || '');
                setProfilePicture(data.profilePicture || '');
            } else {
                setFetchError(data.msg || 'Failed to fetch profile data.');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setFetchError('Network error or server is unreachable.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch profile on component mount or when auth state changes
    useEffect(() => {
        fetchUserProfile();
    }, [isAuthenticated, authToken]); // Depend on isAuthenticated and authToken

    // Handle profile update submission
    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            setError('You must be logged in to update your profile.');
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        setLoading(true); // Use loading for submission as well
        setError(null);
        setMessage(null);

        const updatedFields = {
            username,
            email,
            bio,
            profilePicture,
        };

        if (newPassword) {
            updatedFields.password = newPassword;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken,
                },
                body: JSON.stringify(updatedFields),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.msg || 'Profile updated successfully!');
                setUserData(data.user); // Update local state with fresh user data
                setIsEditing(false); // Exit edit mode
                setNewPassword(''); // Clear password fields
                setConfirmPassword('');
            } else {
                setError(data.msg || 'Failed to update profile.');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Network error or server is unreachable during update.');
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading profile...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">{fetchError}</span>
            </div>
        );
    }

    if (!userData) {
        return <div className="text-center py-8 text-gray-600">No profile data available.</div>;
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow-xl max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Profile</h2>

            {/* Display Messages */}
            {setError && ( // Assuming global error from AuthContext is also handled
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline ml-2">{setError}</span>
                </div>
            )}
            {setMessage && ( // Assuming global message from AuthContext is also handled
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline ml-2">{setMessage}</span>
                </div>
            )}

            {!isEditing ? (
                // View Profile Mode
                <div className="flex flex-col items-center">
                    <img
                        src={userData.profilePicture || 'https://placehold.co/150x150/cccccc/ffffff?text=User'}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-blue-200 shadow-md"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150/cccccc/ffffff?text=User'; }} // Fallback on error
                    />
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">{userData.username}</h3>
                    <p className="text-gray-600 mb-1">{userData.email}</p>
                    <p className="text-gray-700 text-center max-w-prose mb-4">{userData.bio || 'No bio provided yet.'}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4 border-t pt-4 border-gray-200">
                        <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm">
                            <p className="text-gray-600 text-sm">Total Points:</p>
                            <p className="text-blue-700 font-bold text-3xl">{userData.points}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center shadow-sm">
                            <p className="text-gray-600 text-sm">Challenges Completed:</p>
                            <p className="text-purple-700 font-bold text-3xl">{userData.completedChallenges.length}</p>
                        </div>
                        {/* More stats can go here */}
                        <div className="bg-green-50 p-4 rounded-lg text-center shadow-sm col-span-full">
                            <p className="text-gray-600 text-sm">Member Since:</p>
                            <p className="text-green-700 font-bold text-lg">{new Date(userData.joinedDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsEditing(true)}
                        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Edit Profile
                    </button>
                </div>
            ) : (
                // Edit Profile Mode
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="flex flex-col items-center mb-6">
                        <img
                            src={profilePicture || 'https://placehold.co/150x150/cccccc/ffffff?text=User'}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-blue-200 shadow-md"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150/cccccc/ffffff?text=User'; }} // Fallback on error
                        />
                        <label htmlFor="profilePicture" className="block text-gray-700 text-sm font-bold mb-2">
                            Profile Picture URL:
                        </label>
                        <input
                            type="text"
                            id="profilePicture"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={profilePicture}
                            onChange={(e) => setProfilePicture(e.target.value)}
                            placeholder="Enter image URL"
                        />
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
                            Username:
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                            Email:
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2">
                            Bio:
                        </label>
                        <textarea
                            id="bio"
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-y"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                        ></textarea>
                    </div>
                    <div className="border-t pt-4 border-gray-200">
                        <p className="text-gray-700 text-sm font-bold mb-3">Change Password (optional):</p>
                        <div className="mb-4">
                            <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">
                                New Password:
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Leave blank to keep current password"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                                Confirm New Password:
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export { Profile };
// This component allows users to view and edit their profile information, including username, email, bio, and profile picture.