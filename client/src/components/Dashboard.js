// coders-hangout/client/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { QuestionList } from './QuestionList.js';
import { AskQuestion } from './AskQuestion.js';
import { QuestionDetail } from './QuestionDetail.js';
import { CodeVisualizer } from './CodeVisualizer.js';
import { DailyQuestList } from './DailyQuestList.js';
import { DailyQuestDetail } from './DailyQuestDetail.js';
import { Profile } from './Profile.js';
import { Chat } from './Chat.js';
import { Leaderboard } from './Leaderboard.js';
import { AdminPanel } from './AdminPanel.js';

function Dashboard() {
    // Destructure userRole from useAuth to control admin panel visibility
    const { logout, message, isAuthenticated, authToken, userRole } = useAuth();
    // State to manage the currently active tab in the dashboard
    const [activeTab, setActiveTab] = useState('questions');
    // State to store the ID of the currently selected question for detail view
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    // State to store the ID of the currently selected challenge for detail view
    const [selectedChallengeId, setSelectedChallengeId] = useState(null);
    // State to store the username for display in the header
    const [username, setUsername] = useState('Coder');

    // Effect to decode JWT and extract username for display
    useEffect(() => {
        if (authToken) {
            try {
                // Decode the base64 part of the JWT token
                const decodedToken = JSON.parse(atob(authToken.split('.')[1]));
                // Check if user and username exist in the decoded token
                if (decodedToken && decodedToken.user && decodedToken.user.username) {
                    setUsername(decodedToken.user.username);
                } else {
                    // Fallback username if decoding fails or username is not found
                    setUsername('Fellow Coder');
                }
            } catch (error) {
                // Log any errors during token decoding
                console.error("Failed to decode token:", error);
                setUsername('Fellow Coder'); // Fallback on error
            }
        } else {
            setUsername('Coder'); // Default if no auth token is present
        }
    }, [authToken]); // Re-run effect when authToken changes

    // Function to render success messages
    const renderMessage = () => {
        if (message) {
            return (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline ml-2">{message}</span>
                </div>
            );
        }
        return null; // Don't render anything if no message
    };

    // If not authenticated, display a login prompt
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-center">
                <p className="text-gray-600 text-xl">Please log in to view the dashboard.</p>
            </div>
        );
    }

    // Handlers for navigating between different sections/tabs
    const handleViewQuestion = (id) => {
        setSelectedQuestionId(id);
        setActiveTab('questionDetail');
    };

    const handleBackToList = () => {
        setSelectedQuestionId(null);
        setSelectedChallengeId(null); // Clear challenge ID when going back to question list
        setActiveTab('questions');
    };

    const handleViewChallenge = (id) => {
        setSelectedChallengeId(id);
        setActiveTab('challengeDetail');
    };

    const handleBackToChallengeList = () => {
        setSelectedChallengeId(null);
        setActiveTab('dailyQuests');
    };

    const handleViewProfile = () => {
        setSelectedQuestionId(null);
        setSelectedChallengeId(null);
        setActiveTab('profile');
    };

    const handleViewChat = () => {
        setSelectedQuestionId(null);
        setSelectedChallengeId(null);
        setActiveTab('chat');
    };

    const handleViewLeaderboard = () => {
        setSelectedQuestionId(null);
        setSelectedChallengeId(null);
        setActiveTab('leaderboard');
    };

    const handleViewAdminPanel = () => {
        setSelectedQuestionId(null);
        setSelectedChallengeId(null);
        setActiveTab('adminPanel');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Enhanced Header/Navigation Bar */}
            {/*
                Updated:
                - Header `h-20` (fixed height) is retained.
                - `items-center` on the header ensures vertical centering of its direct children.
                - Inner divs now use `flex-grow` and `flex-shrink` to manage their space within the fixed height.
                - Removed `py-2` from inner divs, relying on `items-center` on the parent header for vertical alignment.
            */}
            <header className="bg-gradient-to-r from-blue-900 to-blue-700 shadow-lg px-4 sm:px-6 mb-6 flex flex-col sm:flex-row justify-between items-center rounded-b-xl w-full h-20 flex-shrink-0">
                {/* Title div: `flex-grow` allows it to take available space, `flex-shrink-0` prevents shrinking */}
                <div className="flex items-center w-full sm:w-auto justify-center sm:justify-start flex-grow flex-shrink-0">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide text-center sm:text-left">
                        Coders <span className="text-blue-300">Hangout</span>
                    </h1>
                </div>

                {/* User Actions div: `flex-grow` allows it to take available space, `flex-shrink-0` prevents shrinking */}
                <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto flex-grow flex-shrink-0">
                    <span className="text-white text-sm sm:text-base mr-4 hidden md:block font-medium">Hello, {username}!</span>
                    <button
                        onClick={logout}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-sm sm:text-base border border-red-400"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Separate Navigation Buttons below the header */}
            <nav className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => {
                        setActiveTab('questions');
                        setSelectedQuestionId(null);
                        setSelectedChallengeId(null);
                    }}
                    className={`py-2 px-4 rounded-full font-semibold text-base transition duration-300 ease-in-out transform hover:scale-105
                        ${activeTab === 'questions' || activeTab === 'questionDetail'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-blue-700 hover:bg-gray-300 shadow-md'
                        }`}
                >
                    Q&A Board
                </button>
                <button
                    onClick={() => {
                        setActiveTab('ask');
                        setSelectedQuestionId(null);
                        setSelectedChallengeId(null);
                    }}
                    className={`py-2 px-4 rounded-full font-semibold text-base transition duration-300 ease-in-out transform hover:scale-105
                        ${activeTab === 'ask'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-blue-700 hover:bg-gray-300 shadow-md'
                        }`}
                >
                    Ask a Question
                </button>
                <button
                    onClick={() => {
                        setActiveTab('visualizer');
                        setSelectedQuestionId(null);
                        setSelectedChallengeId(null);
                    }}
                    className={`py-2 px-4 rounded-full font-semibold text-base transition duration-300 ease-in-out transform hover:scale-105
                        ${activeTab === 'visualizer'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-blue-700 hover:bg-gray-300 shadow-md'
                        }`}
                >
                    Code Visualizer
                </button>
                <button
                    onClick={() => {
                        setActiveTab('dailyQuests');
                        setSelectedQuestionId(null);
                        setSelectedChallengeId(null);
                    }}
                    className={`py-2 px-4 rounded-full font-semibold text-base transition duration-300 ease-in-out transform hover:scale-105
                        ${activeTab === 'dailyQuests' || activeTab === 'challengeDetail'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-blue-700 hover:bg-gray-300 shadow-md'
                        }`}
                >
                    Daily Quests
                </button>
                <button
                    onClick={handleViewProfile}
                    className={`py-2 px-4 rounded-full font-semibold text-base transition duration-300 ease-in-out transform hover:scale-105
                        ${activeTab === 'profile'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-blue-700 hover:bg-gray-300 shadow-md'
                        }`}
                >
                    Profile
                </button>
                <button
                    onClick={handleViewChat}
                    className={`py-2 px-4 rounded-full font-semibold text-base transition duration-300 ease-in-out transform hover:scale-105
                        ${activeTab === 'chat'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-blue-700 hover:bg-gray-300 shadow-md'
                        }`}
                >
                    Global Chat
                </button>
                <button
                    onClick={handleViewLeaderboard}
                    className={`py-2 px-4 rounded-full font-semibold text-base transition duration-300 ease-in-out transform hover:scale-105
                        ${activeTab === 'leaderboard'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-blue-700 hover:bg-gray-300 shadow-md'
                        }`}
                >
                    Leaderboard
                </button>
                {/* CONDITIONAL RENDERING FOR ADMIN PANEL */}
                {userRole === 'admin' && (
                    <button
                        onClick={handleViewAdminPanel}
                        className={`py-2 px-4 rounded-full font-semibold text-base transition duration-300 ease-in-out transform hover:scale-105
                            ${activeTab === 'adminPanel'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-200 text-blue-700 hover:bg-gray-300 shadow-md'
                            }`}
                    >
                        Admin Panel
                    </button>
                )}
            </nav>

            {/* Main content area - now full width with padding */}
            <main className="w-full flex-grow p-4 sm:px-6 lg:px-8">
                {renderMessage()}

                {/* Content based on active tab */}
                <div className="bg-white p-6 rounded-lg shadow-xl">
                    {activeTab === 'questions' && <QuestionList onViewQuestion={handleViewQuestion} />}
                    {activeTab === 'ask' && <AskQuestion onQuestionPosted={() => setActiveTab('questions')} />}
                    {activeTab === 'questionDetail' && selectedQuestionId && (
                        <QuestionDetail questionId={selectedQuestionId} onBackToList={handleBackToList} />
                    )}
                    {activeTab === 'visualizer' && <CodeVisualizer />}
                    {activeTab === 'dailyQuests' && <DailyQuestList onViewChallenge={handleViewChallenge} />}
                    {activeTab === 'challengeDetail' && selectedChallengeId && (
                        <DailyQuestDetail challengeId={selectedChallengeId} onBackToList={handleBackToChallengeList} />
                    )}
                    {activeTab === 'profile' && <Profile />}
                    {activeTab === 'chat' && <Chat />}
                    {activeTab === 'leaderboard' && <Leaderboard />}
                    {activeTab === 'adminPanel' && userRole === 'admin' && <AdminPanel />} {/* Render only if activeTab and userRole is admin */}
                </div>
            </main>

            <footer className="mt-8 text-gray-500 text-sm text-center w-full p-4">
                &copy; {new Date().getFullYear()} Coders Hangout. All rights reserved.
            </footer>
        </div>
    );
}

export default Dashboard;
