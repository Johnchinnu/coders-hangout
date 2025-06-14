// coders-hangout/client/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QuestionList } from './QuestionList';
import { AskQuestion } from './AskQuestion';
import { QuestionDetail } from './QuestionDetail';
import { CodeVisualizer } from './CodeVisualizer';
import { DailyQuestList } from './DailyQuestList';
import { DailyQuestDetail } from './DailyQuestDetail';
import { Profile } from './Profile'; // Import the new Profile component

function Dashboard() {
    const { logout, message, isAuthenticated, authToken } = useAuth();
    const [activeTab, setActiveTab] = useState('questions');
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    const [selectedChallengeId, setSelectedChallengeId] = useState(null);
    const [username, setUsername] = useState('Coder');

    // Function to decode JWT and get username
    useEffect(() => {
        if (authToken) {
            try {
                const decodedToken = JSON.parse(atob(authToken.split('.')[1]));
                if (decodedToken && decodedToken.user && decodedToken.user.username) {
                    setUsername(decodedToken.user.username);
                } else {
                    setUsername('Fellow Coder');
                }
            } catch (error) {
                console.error("Failed to decode token:", error);
                setUsername('Fellow Coder');
            }
        } else {
            setUsername('Coder');
        }
    }, [authToken]);

    const renderMessage = () => {
        if (message) {
            return (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline ml-2">{message}</span>
                </div>
            );
        }
        return null;
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-center">
                <p className="text-gray-600 text-xl">Please log in to view the dashboard.</p>
            </div>
        );
    }

    const handleViewQuestion = (id) => {
        setSelectedQuestionId(id);
        setActiveTab('questionDetail');
    };

    const handleBackToList = () => {
        setSelectedQuestionId(null);
        setSelectedChallengeId(null); // Also clear challenge when navigating back
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
        setActiveTab('profile'); // New tab for profile
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Enhanced Header/Navigation Bar */}
            <header className="bg-gradient-to-r from-blue-900 to-blue-700 shadow-lg p-4 sm:p-6 mb-6 flex flex-col sm:flex-row justify-between items-center rounded-b-xl">
                <div className="flex items-center mb-4 sm:mb-0">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
                        Coders <span className="text-blue-300">Hangout</span>
                    </h1>
                </div>

                {/* User Actions (Logout and Hello message remain in header) */}
                <div className="flex items-center">
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
            <nav className="flex flex-wrap justify-center space-x-4 mb-6 px-4 sm:px-6 lg:px-8">
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
                    onClick={handleViewProfile} // New handler for Profile tab
                    className={`py-2 px-4 rounded-full font-semibold text-base transition duration-300 ease-in-out transform hover:scale-105
                        ${activeTab === 'profile'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-blue-700 hover:bg-gray-300 shadow-md'
                        }`}
                >
                    Profile
                </button>
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
                    {activeTab === 'profile' && <Profile />} {/* Render Profile component */}
                </div>
            </main>

            <footer className="mt-8 text-gray-500 text-sm text-center w-full p-4">
                &copy; {new Date().getFullYear()} Coders Hangout. All rights reserved.
            </footer>
        </div>
    );
}

export default Dashboard;
