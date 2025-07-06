// coders-hangout/client/src/components/DailyQuestDetail.js
import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react'; // For the code editor
import { useAuth } from '../context/AuthContext'; // For authToken and messages

function DailyQuestDetail({ challengeId, onBackToList }) {
    const { authToken, isAuthenticated, setError, setMessage } = useAuth();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [userCode, setUserCode] = useState('');
    const [language, setLanguage] = useState('javascript'); // Default language for solution
    const [solutionOutput, setSolutionOutput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    const API_BASE_URL = 'https://coders-hangout-backend.onrender.com/api/challenges';
    // Removed EXECUTE_API_URL here as submission logic is now integrated into challenge submit route

    // Monaco Editor options
    const editorOptions = {
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
    };

    // Fetch challenge details on component mount or when challengeId changes
    useEffect(() => {
        const fetchChallengeDetails = async () => {
            setLoading(true);
            setFetchError(null);
            setError(null); // Clear global auth error
            setMessage(null); // Clear global auth message
            try {
                const response = await fetch(`${API_BASE_URL}/${challengeId}`);
                const data = await response.json();

                if (response.ok) {
                    setChallenge(data);
                    // Set initial code based on starter code for the default language
                    setUserCode(data.starterCode[language] || '// Write your code here');
                } else {
                    setFetchError(data.msg || 'Failed to load challenge details.');
                }
            } catch (err) {
                console.error('Error fetching challenge details:', err);
                setFetchError('Network error or server is unreachable.');
            } finally {
                setLoading(false);
            }
        };

        if (challengeId) {
            fetchChallengeDetails();
        }
    }, [challengeId, language, setError, setMessage]); // Re-fetch if language changes to load starter code

    // Handle language change for starter code
    useEffect(() => {
        if (challenge && challenge.starterCode) {
            setUserCode(challenge.starterCode[language] || '// Write your code here');
        }
    }, [language, challenge]);


    // Handle code submission for the challenge
    const handleSubmitSolution = async () => {
        if (!isAuthenticated) {
            setError('You must be logged in to submit a solution.');
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);
        setSolutionOutput('Running and testing your solution...');

        try {
            // Call the new backend challenge submission endpoint
            const response = await fetch(`${API_BASE_URL}/${challengeId}/submit`, { // NEW SUBMIT ENDPOINT
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken, // Send token for authentication
                },
                body: JSON.stringify({ code: userCode, language }),
            });

            const data = await response.json();

            if (response.ok) {
                // Solution accepted
                setSubmitSuccess(data.msg || `Solution Accepted! You earned ${data.userPoints} points!`);
                setSolutionOutput(`Your Code Output:\n${data.output || 'No output.'}`);
                setMessage(data.msg); // Propagate success message globally
                // You might want to refresh user points/completed challenges on profile page here
                // For now, it will update when user navigates to profile, or on next login.
            } else {
                // Solution incorrect or execution error
                setSubmitError(data.msg || data.error || 'Submission failed.');
                setSolutionOutput(`Your Code Output:\n${data.output || 'No output.'}`);
                if (data.expectedOutput) {
                    setSolutionOutput(prev => prev + `\n\nExpected Output:\n${data.expectedOutput}`);
                }
                setError(data.msg || data.error || 'Submission failed.'); // Propagate error globally
            }
        } catch (err) {
            console.error('Error submitting solution:', err);
            setSolutionOutput('Network error or server is unreachable.');
            setSubmitError('Failed to connect to backend for solution testing.');
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading challenge details...</p>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">{fetchError}</span>
                <p className="text-sm mt-2">Could not load challenge details. Please ensure the challenge ID is valid.</p>
                <button
                    onClick={onBackToList}
                    className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                    Back to Challenges
                </button>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="text-center py-8 text-gray-600">
                <p>Challenge not found.</p>
                <button
                    onClick={onBackToList}
                    className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                    Back to Challenges
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
                &larr; Back to Challenges
            </button>

            {/* Challenge Details */}
            <div className="mb-8 border-b pb-6 border-gray-200">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">{challenge.title}</h2>
                <p className="text-gray-700 text-lg mb-4 leading-relaxed">{challenge.description}</p>
                <div className="flex justify-between items-center text-gray-500 text-sm mt-4">
                    <span className={`font-semibold ${
                        challenge.difficulty === 'Easy' ? 'text-green-600' :
                        challenge.difficulty === 'Medium' ? 'text-yellow-600' :
                        'text-red-600'
                    }`}>
                        Difficulty: {challenge.difficulty} (Awards {challenge.pointsAward} points) {/* Display points */}
                    </span>
                    <span>Created: {new Date(challenge.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Example:</h4>
                    <p className="text-gray-700 text-sm mb-1">Input: <code className="bg-gray-200 p-1 rounded text-xs">{challenge.exampleInput || 'N/A'}</code></p>
                    <p className="text-gray-700 text-sm">Output: <code className="bg-gray-200 p-1 rounded text-xs">{challenge.exampleOutput || 'N/A'}</code></p>
                </div>
            </div>

            {/* Solution Editor and Submission */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Solution</h3>
                <div className="mb-4">
                    <label htmlFor="solution-language-select" className="block text-gray-700 text-sm font-bold mb-2">
                        Select Language:
                    </label>
                    <select
                        id="solution-language-select"
                        className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>
                </div>
                <div className="mb-6 border rounded-lg overflow-hidden shadow-sm">
                    <Editor
                        height="400px"
                        language={language}
                        value={userCode}
                        theme="vs-light"
                        onChange={(value) => setUserCode(value)}
                        options={editorOptions}
                    />
                </div>
                <button
                    onClick={handleSubmitSolution}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !isAuthenticated}
                >
                    {isSubmitting ? 'Submitting...' : 'Run & Test Solution'}
                </button>

                {/* Submission Result Output */}
                <div className="mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Result:</h3>
                    {submitError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline ml-2">{submitError}</span>
                        </div>
                    )}
                    {submitSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                            <strong className="font-bold">Success!</strong>
                            <span className="block sm:inline ml-2">{submitSuccess}</span>
                        </div>
                    )}
                    <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-auto text-sm min-h-[100px] max-h-[200px]">
                        {solutionOutput || 'Your code output will appear here.'}
                    </pre>
                </div>
            </div>
        </div>
    );
}

export { DailyQuestDetail };
