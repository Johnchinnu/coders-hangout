// coders-hangout/client/src/components/AuthForms.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js'; // Import the useAuth hook

// Reusable Input Field Component
const InputField = ({ id, type, placeholder, value, onChange, label }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-gray-700 text-sm font-bold mb-2">
            {label}
        </label>
        <input
            type={type}
            id={id}
            // Adjusted px-4 to px-3 to give more horizontal space for text
            className="shadow appearance-none border rounded-lg w-full py-3 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required
        />
    </div>
);

// Registration Form Component
export const Register = ({ onAuthSuccess }) => {
    const { register, loading, error, message, setError, setMessage } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        setError(null);
        setMessage(null);
        return () => {
            setError(null);
            setMessage(null);
        };
    }, [setError, setMessage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await register(username, email, password);
        if (success) {
            onAuthSuccess();
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-[800px] w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Register</h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}
            {message && !error && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline ml-2">{message}</span>
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <InputField
                    id="username"
                    type="text"
                    label="Username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <InputField
                    id="email"
                    type="email"
                    label="Email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <InputField
                    id="password"
                    type="password"
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
        </div>
    );
};

// Login Form Component
export const Login = ({ onAuthSuccess }) => {
    const { login, loading, error, message, setError, setMessage } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        setError(null);
        setMessage(null);
        return () => {
            setError(null);
            setMessage(null);
        };
    }, [setError, setMessage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            onAuthSuccess();
        }
    };

    const leftWingImageUrl = '/RR.png';
    const rightWingImageUrl = '/RR.png';

    return (
        // Main container for the login form and its wings
        // Removed `min-h-screen` and `py-8` to allow content to dictate height
        // This will make the component take up less vertical space, helping it fit in one view.
        <div className="relative flex flex-col md:flex-row justify-center items-center w-full px-4 overflow-hidden bg-gradient-to-br from-gray-50 to-[#E0F7FA]">
            {/* Left Wing Image */}
            {/* Hidden on small screens, shown on medium and larger */}
            <img
                src={leftWingImageUrl}
                alt="Left decorative wing"
                className="hidden md:block absolute md:relative md:-mr-16 w-64 h-auto z-0 transform -scale-x-100 filter brightness-105"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/256x256/cccccc/333333?text=Left+Wing';
                }}
            />

            {/* Login Form */}
            {/* Changed max-w-xl to max-w-2xl to make the login box significantly wider */}
            <div className="backdrop-blur bg-white/90 p-6 rounded-lg shadow-xl max-w-2xl w-full z-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Login</h2>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}
                {message && !error && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <strong className="font-bold">Success!</strong>
                        <span className="block sm:inline ml-2">{message}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <InputField
                        id="email"
                        type="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <InputField
                        id="password"
                        type="password"
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>

            {/* Right Wing Image */}
            <img
                src={rightWingImageUrl}
                alt="Right decorative wing"
                className="hidden md:block absolute md:relative md:-ml-16 w-64 h-auto z-0 filter brightness-105"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/256x256/cccccc/333333?text=Right+Wing';
                }}
            />
        </div>
    );
};