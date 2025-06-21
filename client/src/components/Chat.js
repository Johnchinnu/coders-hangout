// coders-hangout/client/src/components/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client'; // Import the socket.io-client library
import { useAuth } from '../context/AuthContext'; // To get authToken and user info

function Chat() {
    const { authToken, isAuthenticated, error, setError, setMessage } = useAuth();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null); // Ref for scrolling to the latest message

    const CHAT_SERVER_URL = 'http://localhost:5000'; // Your backend Socket.IO server URL

    // Effect to establish and manage Socket.IO connection
    useEffect(() => {
        if (!isAuthenticated) {
            setMessages([]); // Clear messages if logged out
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Connect to Socket.IO server, sending the auth token
        const newSocket = io(CHAT_SERVER_URL, {
            auth: {
                token: authToken // Send the JWT token for authentication
            }
        });

        // Event listener for successful connection
        newSocket.on('connect', () => {
            console.log('Connected to chat server!');
            setMessage('Connected to chat server!');
            setError(null); // Clear any previous connection errors
        });

        // Event listener for connection errors (e.g., authentication failed)
        newSocket.on('connect_error', (err) => {
            console.error('Chat connection error:', err.message);
            setError(`Chat connection failed: ${err.message}. Please try logging in again.`);
            setMessages([]); // Clear messages on error
        });

        // Event listener for chat history
        newSocket.on('chat history', (history) => {
            console.log('Received chat history:', history);
            setMessages(history);
        });

        // Event listener for new chat messages
        newSocket.on('chat message', (msg) => {
            console.log('New message received:', msg);
            setMessages((prevMessages) => [...prevMessages, msg]);
        });

        // Event listener for general chat errors from server
        newSocket.on('chat error', (errMsg) => {
            console.error('Server chat error:', errMsg);
            setError(`Chat Error: ${errMsg}`);
        });

        // Event listener for disconnection
        newSocket.on('disconnect', () => {
            console.log('Disconnected from chat server.');
            setMessage('Disconnected from chat server.');
            setError(null);
        });

        setSocket(newSocket); // Store the socket instance in state

        // Cleanup function: Disconnect socket when component unmounts or isAuthenticated changes
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [isAuthenticated, authToken, setError, setMessage]); // Reconnect if auth token or status changes

    // Effect to scroll to the bottom of the messages div whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle sending a message
    const sendMessage = (e) => {
        e.preventDefault();
        if (inputMessage.trim() && socket && isAuthenticated) {
            socket.emit('chat message', inputMessage.trim()); // Emit 'chat message' event
            setInputMessage(''); // Clear input field
            setError(null); // Clear any old errors
        } else if (!isAuthenticated) {
            setError('Please log in to send messages.');
        } else if (!socket) {
            setError('Not connected to chat server.');
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-xl flex flex-col h-[70vh]"> {/* Set a fixed height */}
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Global Chat</h2>

            {/* Error/Success Messages specific to chat */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Chat Error!</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}
            {setMessage && ( // Assuming global message from AuthContext is also handled
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">Chat Status:</strong>
                    <span className="block sm:inline ml-2">{setMessage}</span>
                </div>
            )}

            {/* Messages Display Area */}
            <div className="flex-grow overflow-y-auto border border-gray-300 rounded-lg p-4 mb-4 bg-gray-50">
                {messages.length === 0 && !error && !socket?.connected ? (
                    <p className="text-center text-gray-500">
                        {isAuthenticated ? 'Connecting to chat or no messages yet...' : 'Please log in to join the chat.'}
                    </p>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="mb-2 last:mb-0">
                            <span className="font-semibold text-blue-700">{msg.sender}: </span>
                            <span className="text-gray-800">{msg.text}</span>
                            <span className="text-gray-500 text-xs ml-2">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} /> {/* For auto-scrolling */}
            </div>

            {/* Message Input Form */}
            <form onSubmit={sendMessage} className="flex gap-2">
                <input
                    type="text"
                    className="flex-grow shadow appearance-none border rounded-lg py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
                    placeholder={isAuthenticated ? "Type your message..." : "Log in to chat..."}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={!isAuthenticated || !socket?.connected} // Disable if not authenticated or not connected
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isAuthenticated || !socket?.connected || inputMessage.trim() === ''}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export { Chat };
