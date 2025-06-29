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

    // States for dynamic array input
    const [customArrayInput, setCustomArrayInput] = useState('64,34,25,12,22,11,90,5,78,45,10,80'); // Default example array string
    const [visualizationArray, setVisualizationArray] = useState([]); // The actual array used for visualization
    const [arrayInputError, setArrayInputError] = useState(null); // Error for array input

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
        setArrayInputError(null); // Clear array input error

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

    // --- Dynamic Array Input Handling ---
    const loadCustomArray = () => {
        setArrayInputError(null);
        setError(null); // Clear global errors
        setMessage(null); // Clear global messages

        const parsedArray = customArrayInput
            .split(',')
            .map(numStr => Number(numStr.trim()))
            .filter(num => !isNaN(num)); // Filter out non-numeric values after parsing

        if (parsedArray.length === 0 && customArrayInput.trim() !== '') {
            setArrayInputError('Invalid input. Please enter comma-separated numbers (e.g., 10,20,5).');
            return;
        }
        if (parsedArray.length > 20) {
            setArrayInputError('Please keep the array size under 20 elements for better visualization.');
            return;
        }
        if (parsedArray.some(num => num <= 0 || num > 300)) { // Ensure numbers are positive and not too large for scale
            setArrayInputError('Numbers should be positive and less than 300 for optimal visualization.');
            return;
        }

        setVisualizationArray(parsedArray);
        drawArray(canvasRef.current.getContext('2d'), parsedArray); // Draw initial state of new array
        setOutput(`Loaded array for visualization: [${parsedArray.join(', ')}]`);
        setIsVisualizing(false); // Stop any previous visualization
        cancelAnimationFrame(animationFrameId.current);
    };

    // Initialize visualizationArray on component mount with default value
    useEffect(() => {
        loadCustomArray(); // Call once to set initial array
    }, []); // Empty dependency array means this runs only once on mount


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
        if (!isVisualizing && visualizationArray.length === 0) { // Only show this if no array loaded
            ctx.fillText('Enter numbers and click "Load Array" to visualize.', canvas.width / 2, canvas.height / 2);
        } else if (!isVisualizing && visualizationArray.length > 0) {
             drawArray(ctx, visualizationArray); // Redraw current array if not visualizing
        }
    };

    useEffect(() => {
        // Set initial canvas state on component mount
        // This useEffect now mostly handles cleanup and initial draw based on `visualizationArray`
        if (visualizationArray.length > 0) {
            drawArray(canvasRef.current.getContext('2d'), visualizationArray);
        } else {
            drawInitialCanvasState();
        }

        // Cleanup function to cancel any ongoing animation when component unmounts
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [visualizationArray]); // Re-draw when visualizationArray changes

    // Function to draw the array elements as bars
    const drawArray = (ctx, arr, highlightIndices = [], swapIndices = [], pivotIndex = -1, sortedIndices = [], comparingIndices = [], mergeRange = [], heapRootIndex = -1) => {
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
            if (mergeRange.includes(index)) {
                ctx.fillStyle = '#00CED1'; // Dark Turquoise for merge range
            }
            if (index === heapRootIndex) { // NEW: Heap root highlight
                ctx.fillStyle = '#FFD700'; // Gold color for heap root
            }


            ctx.fillRect(x, y, barWidth - 2, barHeight); // -2 for slight gap between bars

            // Draw value on top of the bar
            ctx.fillStyle = '#ffffff'; // White text
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(val, x + barWidth / 2, y + 15);
        });
    };

    // Sorting Visualization Logic orchestrator
    const visualizeSort = async (sortFunction) => {
        setIsVisualizing(true);
        setOutput(`Visualizing ${visualizationAlgorithm.split(/(?=[A-Z])/).join(' ')}...\n`); // Nicer name for output
        cancelAnimationFrame(animationFrameId.current); // Stop any previous animation
        setError(null); // Clear previous errors
        setMessage(null); // Clear previous messages
        setArrayInputError(null); // Clear array input error

        if (visualizationArray.length === 0) {
            setArrayInputError('Please load an array first before visualizing.');
            setIsVisualizing(false);
            return;
        }

        let arr = [...visualizationArray]; // Create a mutable copy of the loaded array
        const ctx = canvasRef.current.getContext('2d');

        const sortedIndices = []; // Used across multiple sorts for final green state

        await sortFunction(arr, ctx, sortedIndices); // Pass arr, ctx, sortedIndices

        // Final draw to ensure all bars are sorted color
        sortedIndices.length = 0; // Clear it to re-fill with all indices
        for(let k = 0; k < arr.length; k++) {
            sortedIndices.push(k);
        }
        drawArray(ctx, arr, [], [], -1, sortedIndices);
        setOutput(prev => prev + `\n${visualizationAlgorithm.split(/(?=[A-Z])/).join(' ')} Finished! Sorted Array: [${arr.join(', ')}]`);
        setIsVisualizing(false);
    };


    // Bubble Sort Visualization Helper
    const bubbleSortHelper = async (arr, ctx, sortedIndices) => {
        const n = arr.length;
        drawArray(ctx, arr);
        await new Promise(resolve => setTimeout(resolve, 500));

        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - 1 - i; j++) {
                drawArray(ctx, arr, [], [], -1, sortedIndices, [j, j + 1]);
                await new Promise(resolve => setTimeout(resolve, 100));

                if (arr[j] > arr[j + 1]) {
                    drawArray(ctx, arr, [], [j, j + 1], -1, sortedIndices);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    drawArray(ctx, arr, [], [], -1, sortedIndices);
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            sortedIndices.push(n - 1 - i);
        }
        sortedIndices.push(0);
    };

    // Quick Sort Visualization Helper
    const quickSortHelper = async (arr, ctx, sortedIndices) => {
        const partition = async (arr, low, high) => {
            let pivot = arr[high];
            let i = (low - 1);

            drawArray(ctx, arr, [], [], high, sortedIndices);
            await new Promise(resolve => setTimeout(resolve, 300));

            for (let j = low; j <= high - 1; j++) {
                drawArray(ctx, arr, [], [], high, sortedIndices, [i + 1, j]);
                await new Promise(resolve => setTimeout(resolve, 100));

                if (arr[j] < pivot) {
                    i++;
                    if (i !== j) {
                        drawArray(ctx, arr, [], [i, j], high, sortedIndices);
                        await new Promise(resolve => setTimeout(resolve, 200));
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                        drawArray(ctx, arr, [], [], high, sortedIndices);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            }
            if (i + 1 !== high) {
                drawArray(ctx, arr, [], [i + 1, high], high, sortedIndices);
                await new Promise(resolve => setTimeout(resolve, 200));
                [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
                drawArray(ctx, arr, [], [], -1, sortedIndices);
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                 drawArray(ctx, arr, [], [], -1, sortedIndices);
                 await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (!sortedIndices.includes(i + 1)) sortedIndices.push(i + 1);
            return i + 1;
        };

        const quickSortRecursive = async (arr, low, high) => {
            if (low < high) {
                let pi = await partition(arr, low, high);
                await quickSortRecursive(arr, low, pi - 1);
                await quickSortRecursive(arr, pi + 1, high);
            } else if (low === high) {
                if (!sortedIndices.includes(low)) sortedIndices.push(low);
            }
        };

        await quickSortRecursive(arr, 0, arr.length - 1);
        sortedIndices.sort((a, b) => a - b);
    };

    // Insertion Sort Visualization Helper
    const insertionSortHelper = async (arr, ctx, sortedIndices) => {
        const n = arr.length;
        drawArray(ctx, arr);
        await new Promise(resolve => setTimeout(resolve, 500));

        sortedIndices.push(0);
        drawArray(ctx, arr, [], [], -1, sortedIndices);
        await new Promise(resolve => setTimeout(resolve, 200));

        for (let i = 1; i < n; i++) {
            let key = arr[i];
            let j = i - 1;

            drawArray(ctx, arr, [i], [], -1, sortedIndices);
            await new Promise(resolve => setTimeout(resolve, 300));

            while (j >= 0 && arr[j] > key) {
                drawArray(ctx, arr, [i], [], -1, sortedIndices, [j]);
                await new Promise(resolve => setTimeout(resolve, 150));

                arr[j + 1] = arr[j];
                j = j - 1;
                drawArray(ctx, arr, [j + 1], [], -1, sortedIndices);
                await new Promise(resolve => setTimeout(resolve, 150));
            }
            arr[j + 1] = key;

            sortedIndices.length = 0;
            for(let k = 0; k <= i; k++) {
                sortedIndices.push(k);
            }
            drawArray(ctx, arr, [], [], -1, sortedIndices);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    };

    // Merge Sort Visualization Helper
    const mergeSortHelper = async (arr, ctx, sortedIndices) => {
        const n = arr.length;

        const mergeSortRecursive = async (currentArr, start, end) => {
            if (start >= end) {
                return; // Base case: single element
            }

            const mid = Math.floor((start + end) / 2);

            drawArray(ctx, arr, [], [], -1, sortedIndices, [], Array.from({length: end - start + 1}, (_, i) => i + start));
            await new Promise(resolve => setTimeout(resolve, 200));

            await mergeSortRecursive(arr, start, mid);
            await mergeSortRecursive(arr, mid + 1, end);

            let i = start;
            let j = mid + 1;
            let k = start;
            const temp = []; // Temporary array for merging
            let leftPtr = 0; // Relative pointer for left half
            let rightPtr = 0; // Relative pointer for right half

            // Create temporary copies of the sub-arrays
            const leftHalf = arr.slice(start, mid + 1);
            const rightHalf = arr.slice(mid + 1, end + 1);


            drawArray(ctx, arr, [], [], -1, sortedIndices, [start, end], Array.from({length: end - start + 1}, (_, i) => i + start));
            await new Promise(resolve => setTimeout(resolve, 300));

            while (leftPtr < leftHalf.length && rightPtr < rightHalf.length) {
                drawArray(ctx, arr, [start + leftPtr, mid + 1 + rightPtr], [], -1, sortedIndices, [], Array.from({length: end - start + 1}, (_, i) => i + start));
                await new Promise(resolve => setTimeout(resolve, 100));

                if (leftHalf[leftPtr] <= rightHalf[rightPtr]) {
                    arr[k++] = leftHalf[leftPtr++];
                } else {
                    arr[k++] = rightHalf[rightPtr++];
                }
                drawArray(ctx, arr, [], [], -1, sortedIndices, [], Array.from({length: end - start + 1}, (_, i) => i + start));
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            while (leftPtr < leftHalf.length) {
                arr[k++] = leftHalf[leftPtr++];
                drawArray(ctx, arr, [], [], -1, sortedIndices, [], Array.from({length: end - start + 1}, (_, i) => i + start));
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            while (rightPtr < rightHalf.length) {
                arr[k++] = rightHalf[rightPtr++];
                drawArray(ctx, arr, [], [], -1, sortedIndices, [], Array.from({length: end - start + 1}, (_, i) => i + start));
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            for (let idx = start; idx <= end; idx++) {
                if (!sortedIndices.includes(idx)) {
                    sortedIndices.push(idx);
                }
            }
            sortedIndices.sort((a,b) => a-b);
            drawArray(ctx, arr, [], [], -1, sortedIndices);
            await new Promise(resolve => setTimeout(resolve, 400));
        };

        await mergeSortRecursive(arr, 0, arr.length - 1);
        sortedIndices.sort((a,b) => a-b);
    };

    // NEW: Heap Sort Visualization Helper
    const heapSortHelper = async (arr, ctx, sortedIndices) => {
        const n = arr.length;

        // Function to heapify a subtree rooted with node i (index)
        // n is the size of the heap
        const heapify = async (arr, n, i, sortedPartEndIndex) => {
            let largest = i; // Initialize largest as root
            let l = 2 * i + 1; // Left child
            let r = 2 * i + 2; // Right child

            // Visualize current heapify operation
            const currentHeapifyIndices = [i]; // Highlight current root
            if (l < n) currentHeapifyIndices.push(l);
            if (r < n) currentHeapifyIndices.push(r);
            drawArray(ctx, arr, [], [], -1, sortedIndices, currentHeapifyIndices, [], i); // Highlighting current tree root, comparing children
            await new Promise(resolve => setTimeout(resolve, 100));


            // If left child is larger than root
            if (l < n && arr[l] > arr[largest]) {
                largest = l;
            }

            // If right child is larger than largest so far
            if (r < n && arr[r] > arr[largest]) {
                largest = r;
            }

            // If largest is not root
            if (largest !== i) {
                drawArray(ctx, arr, [], [i, largest], -1, sortedIndices, currentHeapifyIndices, [], i); // Highlight elements to be swapped
                await new Promise(resolve => setTimeout(resolve, 200));

                [arr[i], arr[largest]] = [arr[largest], arr[i]]; // Swap
                drawArray(ctx, arr, [], [], -1, sortedIndices, [], [], i); // Draw after swap
                await new Promise(resolve => setTimeout(resolve, 100));

                // Recursively heapify the affected sub-tree
                await heapify(arr, n, largest, sortedPartEndIndex);
            }
        };

        drawArray(ctx, arr);
        await new Promise(resolve => setTimeout(resolve, 500));


        // Build heap (rearrange array)
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            await heapify(arr, n, i, -1); // -1 indicates no sorted part yet
        }
        setOutput(prev => prev + 'Heap built. Starting sort...\n');
        drawArray(ctx, arr); // Show max-heap state
        await new Promise(resolve => setTimeout(resolve, 500));


        // One by one extract an element from heap
        for (let i = n - 1; i > 0; i--) {
            // Move current root to end
            drawArray(ctx, arr, [], [0, i], -1, sortedIndices); // Highlight swap of root and last unsorted element
            await new Promise(resolve => setTimeout(resolve, 300));
            [arr[0], arr[i]] = [arr[i], arr[0]];

            sortedIndices.push(i); // Mark current element as sorted
            drawArray(ctx, arr, [], [], -1, sortedIndices); // Redraw with sorted element
            await new Promise(resolve => setTimeout(resolve, 200));

            // Call heapify on the reduced heap
            await heapify(arr, i, 0, i - 1); // Pass i as new heap size, 0 as root index, i-1 as end of unsorted part
        }
        sortedIndices.push(0); // Mark the last remaining element as sorted
    };


    // Function to initiate visualization based on selected algorithm
    const startVisualization = () => {
        let sortFunction;
        if (visualizationAlgorithm === 'bubbleSort') {
            sortFunction = bubbleSortHelper;
        } else if (visualizationAlgorithm === 'quickSort') {
            sortFunction = quickSortHelper;
        } else if (visualizationAlgorithm === 'insertionSort') {
            sortFunction = insertionSortHelper;
        } else if (visualizationAlgorithm === 'mergeSort') {
            sortFunction = mergeSortHelper;
        } else if (visualizationAlgorithm === 'heapSort') { // NEW: Handle Heap Sort
            sortFunction = heapSortHelper;
        } else {
            console.error('Unknown visualization algorithm selected.');
            return;
        }
        visualizeSort(sortFunction);
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
                        <option value="insertionSort">Insertion Sort</option>
                        <option value="mergeSort">Merge Sort</option>
                        <option value="heapSort">Heap Sort</option> {/* NEW: Heap Sort option */}
                        {/* Add more visualization options here */}
                    </select>
                </div>
            </div>

            {/* Dynamic Array Input Section */}
            <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-inner border border-gray-200">
                <label htmlFor="custom-array-input" className="block text-gray-700 text-sm font-bold mb-2">
                    Custom Array for Visualization (comma-separated numbers, max 20 elements):
                </label>
                <input
                    type="text"
                    id="custom-array-input"
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="e.g., 50,10,80,30,60,20"
                    value={customArrayInput}
                    onChange={(e) => setCustomArrayInput(e.target.value)}
                />
                <button
                    onClick={loadCustomArray}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isVisualizing || isExecuting}
                >
                    Load Array
                </button>
                {arrayInputError && (
                    <p className="text-red-600 text-sm mt-2">{arrayInputError}</p>
                )}
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
                    disabled={isVisualizing || isExecuting || visualizationArray.length === 0} // Disable if no array loaded
                >
                    {isVisualizing ? 'Visualizing...' : `Visualize ${visualizationAlgorithm.split(/(?=[A-Z])/).join(' ')}`}
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
