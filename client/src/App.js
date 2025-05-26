// coders-hangout/client/src/App.js
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Register, Login } from './components/AuthForms';
import Dashboard from './components/Dashboard'; // Import the Dashboard component

function App() {
    const { isAuthenticated, setError, setMessage } = useAuth();
    const [showLogin, setShowLogin] = useState(true);

    // Function to handle successful authentication (login or register)
    const handleAuthSuccess = () => {
        setMessage(null);
        setError(null);
        // No need to explicitly navigate here, isAuthenticated will trigger Dashboard render
        console.log('Authentication successful! User is now logged in.');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
            {/* Conditional rendering based on authentication status */}
            {!isAuthenticated ? (
                // Show Auth forms if not authenticated
                <div className="flex flex-col items-center justify-center w-full max-w-2xl">
                    <header className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-gray-800 mb-4">
                            Welcome to <span className="text-blue-600">Coders Hangout</span>
                        </h1>
                        <p className="text-xl text-gray-600">
                            Your collaborative platform for coding doubts, visualizations, and daily quests.
                        </p>
                    </header>

                    {/* Authentication Forms */}
                    <div className="w-full flex justify-center">
                        {showLogin ? (
                            <Login onAuthSuccess={handleAuthSuccess} />
                        ) : (
                            <Register onAuthSuccess={handleAuthSuccess} />
                        )}
                    </div>

                    {/* Toggle between Login and Register */}
                    <button
                        onClick={() => {
                            setShowLogin(!showLogin);
                            setError(null);
                            setMessage(null);
                        }}
                        className="mt-6 text-blue-600 hover:text-blue-800 font-semibold transition duration-200 ease-in-out"
                    >
                        {showLogin ? 'Need an account? Register' : 'Already have an account? Login'}
                    </button>
                </div>
            ) : (
                // Show Dashboard if authenticated
                <Dashboard />
            )}

            {/* Footer section (moved outside conditional rendering to always be present) */}
            <footer className="mt-8 text-gray-500 text-sm text-center w-full">
                &copy; {new Date().getFullYear()} Coders Hangout. All rights reserved.
            </footer>
        </div>
    );
}

export default App;
