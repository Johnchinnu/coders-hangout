// coders-hangout/client/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the AuthContext
export const AuthContext = createContext(null);

// AuthProvider component to wrap your application
export const AuthProvider = ({ children }) => {
    // State to hold the authentication token
    const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
    // State to indicate if a user is logged in
    const [isAuthenticated, setIsAuthenticated] = useState(!!authToken);
    // NEW: State to store user's role
    const [userRole, setUserRole] = useState(null);
    // State for loading status (e.g., during API calls)
    const [loading, setLoading] = useState(false);
    // State for any authentication errors
    const [error, setError] = useState(null);
    // State for success messages
    const [message, setMessage] = useState(null);

    // Backend API URL
    const API_URL = 'https://coders-hangout-backend.onrender.com/api/auth'; // Ensure this matches your backend URL

    // Effect to update isAuthenticated and userRole when authToken changes
    useEffect(() => {
        setIsAuthenticated(!!authToken);
        if (authToken) {
            localStorage.setItem('token', authToken); // Persist token in local storage
            try {
                // Decode JWT to get user information including role
                const decodedToken = JSON.parse(atob(authToken.split('.')[1]));
                if (decodedToken && decodedToken.user && decodedToken.user.role) {
                    setUserRole(decodedToken.user.role);
                } else {
                    setUserRole('user'); // Default to 'user' if role not found in token (for older tokens)
                }
            } catch (error) {
                console.error("Failed to decode token:", error);
                setUserRole('user'); // Fallback to 'user' on decode error
            }
        } else {
            localStorage.removeItem('token'); // Remove token if it's null
            setUserRole(null); // Clear role on logout
        }
    }, [authToken]);

    // Function to handle user registration
    const register = async (username, email, password) => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setAuthToken(data.token);
                setMessage(data.msg);
                return true; // Indicate success
            } else {
                setError(data.msg || 'Registration failed');
                return false; // Indicate failure
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('Network error or server is unreachable.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Function to handle user login
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setAuthToken(data.token);
                setMessage(data.msg);
                return true; // Indicate success
            } else {
                setError(data.msg || 'Login failed');
                return false; // Indicate failure
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Network error or server is unreachable.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Function to handle user logout
    const logout = () => {
        setAuthToken(null);
        setIsAuthenticated(false);
        setUserRole(null); // Clear role on logout
        setMessage('Logged out successfully.');
    };

    // Value provided by the AuthContext
    const authContextValue = {
        authToken,
        isAuthenticated,
        userRole, // NEW: Expose userRole
        loading,
        error,
        message,
        register,
        login,
        logout,
        setError,
        setMessage
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
