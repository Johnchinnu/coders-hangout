// coders-hangout/client/src/App.js
import React from 'react';

// Main App component for Coders Hangout
function App() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            {/* Header section with a welcoming message */}
            <header className="text-center mb-8">
                <h1 className="text-5xl font-bold text-gray-800 mb-4">
                    Welcome to <span className="text-blue-600">Coders Hangout</span>
                </h1>
                <p className="text-xl text-gray-600">
                    Your collaborative platform for coding doubts, visualizations, and daily quests.
                </p>
            </header>

            {/* Main content area - currently a placeholder */}
            <main className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full text-center">
                <h2 className="text-3xl font-semibold text-gray-700 mb-4">
                    Get Started
                </h2>
                <p className="text-lg text-gray-500 mb-6">
                    We're building something amazing here. Stay tuned for more features!
                </p>
                {/* A simple call to action button */}
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Explore Features
                </button>
            </main>

            {/* Footer section */}
            <footer className="mt-8 text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Coders Hangout. All rights reserved.
            </footer>
        </div>
    );
}

export default App;