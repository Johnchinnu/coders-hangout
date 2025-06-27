// coders-hangout/client/src/components/CodeVisualizer.js
import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react'; // Import the Monaco Editor component
import { useAuth } from '../context/AuthContext'; // Import useAuth to get authToken

function CodeVisualizer() {
    const { authToken, isAuthenticated, setError, setMessage } = useAuth(); // Get auth context
    const [code, setCode] = useState('// Type your code here, e.g., a sorting algorithm or a recursive function\nfunction factorial(n) {\n  if (n === 0) return 1;\n  return n * factorial(n - 1);\n}\n\nconsole.log(factorial(5));');
    const [output, setOutput] = useState('');
    const [language, setLanguage] = useState('javascript'); // Default language
    const [isExecuting, setIsExecuting] = useState(false); // State for execution loading
    const canvasRef = useRef(null); // Ref for the canvas element
    const animationFrameId = useRef(null); // To store requestAnimationFrame ID
    const [isVisualizing, setIsVisualizing] = useState(false); // State to control visualization
    const [visualizationAlgorithm, setVisualizationAlgorithm] = useState('bubbleSort'); // State for selected visualization algorithm

    const EXECUTE_API_URL = 'http://localhost:5000/api/execute-code'; // Backend execution endpoint

    // Monaco Editor options
    const editorOptions = {
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
    };

    // Handle editor content changes
    const handleEditorChange = (value, event) => {
        setCode(value);
    };

    // Function to run code on the backend
    const runDryRun = async () => {
        if (!isAuthenticated) {
            setError('You must be logged in to run code.');
            return;
        }
        setIsExecuting(true);
        setOutput('Sending code to backend for execution...');
        setError(null);
        setMessage(null);

        // Clear any ongoing visualization
        cancelAnimationFrame(animationFrameId.current);
        setIsVisualizing(false);
        drawInitialCanvasState(); // Reset canvas

        try {
            const response = await fetch(EXECUTE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken, // Send token for authentication
                },
                body: JSON.stringify({ code, language }),
            });

            const data = await response.json();

            if (response.ok) {
                setOutput(data.output || 'No output.');
                setMessage('Code executed successfully!');
            } else {
                setOutput(data.output || data.msg || 'An unknown error occurred.');
                setError(data.error || 'Code execution failed.');
            }
        } catch (err) {
            console.error('Network error during code execution:', err);
            setOutput('Network error or server is unreachable.');
            setError('Failed to connect to backend for code execution.');
        } finally {
            setIsExecuting(false);
        }
    };

    // --- Canvas Visualization Logic ---

    // Function to draw the initial state or clear the canvas
    const drawInitialCanvasState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e0e7ff'; // Light blue background for canvas
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        if (!isVisualizing) {
            ctx.fillText('Visualization Area (Select an algorithm to visualize)', canvas.width / 2, canvas.height / 2);
        }
    };

    useEffect(() => {
        // Set initial canvas state on component mount
        drawInitialCanvasState();

        // Cleanup function to cancel any ongoing animation when component unmounts
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    // Function to draw the array elements as bars
    const drawArray = (ctx, arr, highlightIndices = [], swapIndices = [], pivotIndex = -1, sortedIndices = [], comparingIndices = []) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e0e7ff'; // Background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / arr.length;
        const maxVal = Math.max(...arr);
        const scaleFactor = (canvas.height - 40) / maxVal; // Leave some padding at top/bottom

        arr.forEach((val, index) => {
            const barHeight = val * scaleFactor;
            const x = index * barWidth;
            const y = canvas.height - barHeight; // Draw from bottom up

            ctx.fillStyle = '#4299e1'; // Default bar color (blue-500)

            if (highlightIndices.includes(index)) {
                ctx.fillStyle = '#f59e0b'; // Highlighted (orange-500) - e.g., current element being inserted
            }
            if (swapIndices.includes(index)) {
                ctx.fillStyle = '#ef4444'; // Swapping (red-500)
            }
            if (index === pivotIndex) {
                ctx.fillStyle = '#10b981'; // Pivot (emerald-500)
            }
            if (sortedIndices.includes(index)) {
                ctx.fillStyle = '#65a30d'; // Sorted (lime-700)
            }
            if (comparingIndices.includes(index)) {
                ctx.fillStyle = '#8b5cf6'; // Comparing (purple-500) - specific for Insertion Sort comparison
            }


            ctx.fillRect(x, y, barWidth - 2, barHeight); // -2 for slight gap between bars

            // Draw value on top of the bar
            ctx.fillStyle = '#ffffff'; // White text
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(val, x + barWidth / 2, y + 15);
        });
    };

    const initialArray = [64, 34, 25, 12, 22, 11, 90, 5, 78, 45, 10, 80]; // Example array for visualizations

    // Bubble Sort Visualization Logic
    const visualizeBubbleSort = async () => {
        setIsVisualizing(true);
        setOutput('Visualizing Bubble Sort...\n');
        cancelAnimationFrame(animationFrameId.current); // Stop any previous animation
        setError(null); // Clear previous errors
        setMessage(null); // Clear previous messages

        let arr = [...initialArray]; // Create a mutable copy
        const n = arr.length;
        const ctx = canvasRef.current.getContext('2d');

        const sortedIndices = []; // To track elements that are already sorted

        drawArray(ctx, arr);
        await new Promise(resolve => setTimeout(resolve, 500)); // Initial pause

        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - 1 - i; j++) {
                // Highlight elements being compared
                drawArray(ctx, arr, [], [], -1, sortedIndices, [j, j + 1]); // Using comparingIndices
                await new Promise(resolve => setTimeout(resolve, 100)); // Short pause for comparison highlight

                if (arr[j] > arr[j + 1]) {
                    // Highlight elements being swapped
                    drawArray(ctx, arr, [], [j, j + 1], -1, sortedIndices); // Using swapIndices
                    await new Promise(resolve => setTimeout(resolve, 100)); // Short pause for swap highlight

                    // Swap elements
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    drawArray(ctx, arr, [], [], -1, sortedIndices); // Draw array after swap
                    await new Promise(resolve => setTimeout(resolve, 200)); // Pause after swap
                }
            }
            // After each pass, the largest element is in its correct place at the end
            sortedIndices.push(n - 1 - i); // Mark the last element of the unsorted part as sorted
        }
        sortedIndices.push(0); // Mark the first element as sorted after loop finishes

        drawArray(ctx, arr, [], [], -1, sortedIndices); // Final sorted state with all green
        setOutput(prev => prev + '\nBubble Sort Finished! Sorted Array: [' + arr.join(', ') + ']');
        setIsVisualizing(false);
    };

    // Quick Sort Visualization Logic
    const visualizeQuickSort = async () => {
        setIsVisualizing(true);
        setOutput('Visualizing Quick Sort...\n');
        cancelAnimationFrame(animationFrameId.current);
        setError(null);
        setMessage(null);

        let arr = [...initialArray];
        const ctx = canvasRef.current.getContext('2d');

        const sortedIndices = [];

        // Helper function for partitioning
        const partition = async (arr, low, high) => {
            let pivot = arr[high]; // Choose the last element as the pivot
            let i = (low - 1); // Index of smaller element

            drawArray(ctx, arr, [], [], high, sortedIndices); // Highlight pivot
            await new Promise(resolve => setTimeout(resolve, 300));

            for (let j = low; j <= high - 1; j++) {
                drawArray(ctx, arr, [], [], high, sortedIndices, [i + 1, j]); // Highlight i+1 and j for comparison
                await new Promise(resolve => setTimeout(resolve, 100));

                if (arr[j] < pivot) {
                    i++;
                    if (i !== j) { // Only swap if different elements
                        drawArray(ctx, arr, [], [i, j], high, sortedIndices); // Highlight swap
                        await new Promise(resolve => setTimeout(resolve, 200));
                        [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap
                        drawArray(ctx, arr, [], [], high, sortedIndices); // Draw after swap
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            }
            if (i + 1 !== high) { // Only swap if different elements
                drawArray(ctx, arr, [], [i + 1, high], high, sortedIndices); // Swap pivot into correct position
                await new Promise(resolve => setTimeout(resolve, 200));
                [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
                drawArray(ctx, arr, [], [], -1, sortedIndices); // Draw after swap, clear pivot highlight
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                 drawArray(ctx, arr, [], [], -1, sortedIndices); // Clear pivot highlight
                 await new Promise(resolve => setTimeout(resolve, 100));
            }


            sortedIndices.push(i + 1); // Mark pivot's final position as sorted
            return i + 1;
        };

        // Recursive Quick Sort function
        const quickSort = async (arr, low, high) => {
            if (low < high) {
                let pi = await partition(arr, low, high);

                await quickSort(arr, low, pi - 1);
                await quickSort(arr, pi + 1, high);
            } else if (low === high) { // Base case for single element, it's considered sorted
                sortedIndices.push(low);
            }
        };

        await quickSort(arr, 0, arr.length - 1);
        sortedIndices.sort((a, b) => a - b); // Ensure sorted indices are in order for consistent drawing

        drawArray(ctx, arr, [], [], -1, sortedIndices); // Final sorted state
        setOutput(prev => prev + '\nQuick Sort Finished! Sorted Array: [' + arr.join(', ') + ']');
        setIsVisualizing(false);
    };

    // NEW: Insertion Sort Visualization Logic
    const visualizeInsertionSort = async () => {
        setIsVisualizing(true);
        setOutput('Visualizing Insertion Sort...\n');
        cancelAnimationFrame(animationFrameId.current);
        setError(null);
        setMessage(null);

        let arr = [...initialArray];
        const n = arr.length;
        const ctx = canvasRef.current.getContext('2d');

        const sortedIndices = []; // Elements that are already in their sorted sub-array

        drawArray(ctx, arr);
        await new Promise(resolve => setTimeout(resolve, 500)); // Initial pause

        // First element is considered sorted
        sortedIndices.push(0);
        drawArray(ctx, arr, [], [], -1, sortedIndices);
        await new Promise(resolve => setTimeout(resolve, 200));

        for (let i = 1; i < n; i++) {
            let key = arr[i]; // The element to be inserted
            let j = i - 1;

            // Highlight the 'key' element
            drawArray(ctx, arr, [i], [], -1, sortedIndices);
            await new Promise(resolve => setTimeout(resolve, 300));

            // Move elements of arr[0..i-1], that are greater than key,
            // to one position ahead of their current position
            while (j >= 0 && arr[j] > key) {
                // Highlight elements being compared (key vs arr[j])
                drawArray(ctx, arr, [i], [], -1, sortedIndices, [j]);
                await new Promise(resolve => setTimeout(resolve, 150));

                arr[j + 1] = arr[j];
                j = j - 1;
                // Visualize the shift (element moving right)
                drawArray(ctx, arr, [j + 1], [], -1, sortedIndices); // Highlight shifted element
                await new Promise(resolve => setTimeout(resolve, 150));
            }
            arr[j + 1] = key; // Place the key in its correct position

            // After inserting, update the sorted part and redraw
            // No explicit 'sortedIndices.push(i)' needed in loop, as `j+1` takes care of position
            // The first `i` elements form the sorted part.
            sortedIndices.length = 0; // Clear and rebuild
            for(let k = 0; k <= i; k++) {
                sortedIndices.push(k);
            }
            drawArray(ctx, arr, [], [], -1, sortedIndices); // Redraw with the newly inserted element now part of sorted section
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // After loop, all elements are sorted
        sortedIndices.length = 0;
        for(let k = 0; k < n; k++) {
            sortedIndices.push(k);
        }
        drawArray(ctx, arr, [], [], -1, sortedIndices); // Final sorted state with all green
        setOutput(prev => prev + '\nInsertion Sort Finished! Sorted Array: [' + arr.join(', ') + ']');
        setIsVisualizing(false);
    };


    // Function to initiate visualization based on selected algorithm
    const startVisualization = () => {
        if (isVisualizing) return; // Prevent multiple simultaneous visualizations
        drawInitialCanvasState(); // Clear canvas and reset
        if (visualizationAlgorithm === 'bubbleSort') {
            visualizeBubbleSort();
        } else if (visualizationAlgorithm === 'quickSort') {
            visualizeQuickSort();
        } else if (visualizationAlgorithm === 'insertionSort') { // NEW: Handle Insertion Sort
            visualizeInsertionSort();
        }
        // Add more algorithms here
    };


    return (
        <div className="p-4 bg-white rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Code Visualizer</h2>

            <div className="mb-4 flex flex-wrap justify-center gap-4">
                <div className="flex-grow min-w-[180px]">
                    <label htmlFor="language-select" className="block text-gray-700 text-sm font-bold mb-2">
                        Code Editor Language:
                    </label>
                    <select
                        id="language-select"
                        className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>
                </div>
                <div className="flex-grow min-w-[180px]">
                    <label htmlFor="visualization-algorithm-select" className="block text-gray-700 text-sm font-bold mb-2">
                        Algorithm Visualization:
                    </label>
                    <select
                        id="visualization-algorithm-select"
                        className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                        value={visualizationAlgorithm}
                        onChange={(e) => {
                            setVisualizationAlgorithm(e.target.value);
                            drawInitialCanvasState(); // Clear canvas when changing algorithm
                        }}
                    >
                        <option value="bubbleSort">Bubble Sort</option>
                        <option value="quickSort">Quick Sort</option>
                        <option value="insertionSort">Insertion Sort</option> {/* NEW: Insertion Sort option */}
                        {/* Add more visualization options here */}
                    </select>
                </div>
            </div>

            <div className="mb-6 border rounded-lg overflow-hidden shadow-sm">
                <Editor
                    height="400px" // Set a fixed height for the editor
                    language={language}
                    value={code}
                    theme="vs-light" // Or "vs-dark"
                    onChange={handleEditorChange}
                    options={editorOptions}
                />
            </div>

            <div className="flex justify-center mb-6 space-x-4">
                <button
                    onClick={runDryRun}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isExecuting || isVisualizing || !isAuthenticated}
                >
                    {isExecuting ? 'Executing...' : 'Run Dry Run (Backend)'}
                </button>
                <button
                    onClick={startVisualization} // Call the new handler
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isVisualizing || isExecuting}
                >
                    {isVisualizing ? 'Visualizing...' : `Visualize ${
                        visualizationAlgorithm === 'bubbleSort' ? 'Bubble Sort' :
                        visualizationAlgorithm === 'quickSort' ? 'Quick Sort' :
                        'Insertion Sort' // Dynamic text for the button
                    }`}
                </button>
            </div>

            {/* Output Area */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Output:</h3>
                <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-auto text-sm min-h-[100px] max-h-[200px]">
                    {output || 'Run your code or visualize an algorithm to see output here...'}
                </pre>
            </div>

            {/* Canvas for Visualizations */}
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Algorithm Visualization:</h3>
                <canvas
                    ref={canvasRef}
                    width={800} // Fixed width for now, can be responsive later
                    height={400} // Fixed height for now
                    className="border border-gray-300 rounded-lg w-full max-w-full h-auto"
                ></canvas>
                <p className="text-gray-500 text-sm mt-2 text-center">
                    (This area will show animations of algorithms like sorting, recursion, etc.)
                </p>
            </div>
        </div>
    );
}

export { CodeVisualizer };
