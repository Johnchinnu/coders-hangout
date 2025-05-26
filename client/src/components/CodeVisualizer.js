// coders-hangout/client/src/components/CodeVisualizer.js
import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react'; // Import the Monaco Editor component

function CodeVisualizer() {
    const [code, setCode] = useState('// Type your code here, e.g., a sorting algorithm or a recursive function\nfunction factorial(n) {\n  if (n === 0) return 1;\n  return n * factorial(n - 1);\n}\n\nconsole.log(factorial(5));');
    const [output, setOutput] = useState('');
    const [language, setLanguage] = useState('javascript'); // Default language
    const canvasRef = useRef(null); // Ref for the canvas element

    // Handle editor content changes
    const handleEditorChange = (value, event) => {
        setCode(value);
    };

    // Simulate a dry run (very basic for now)
    const runDryRun = () => {
        setOutput('Simulating dry run...\n\n');
        // In a real scenario, you'd send this code to a backend for sandboxed execution
        // or implement a client-side interpreter/visualizer.
        // For now, let's just show the code and a placeholder for output.
        try {
            // This is a very unsafe way to run user code directly in the browser.
            // DO NOT USE IN PRODUCTION. This is purely for demonstration of immediate feedback.
            // A proper solution involves a secure backend sandbox.
            const consoleOutput = [];
            const originalConsoleLog = console.log;
            console.log = (...args) => {
                consoleOutput.push(args.map(arg => String(arg)).join(' '));
            };

            // Evaluate the code. This is dangerous for untrusted input.
            eval(code); // DANGEROUS: Executes arbitrary code. For demo only.

            console.log = originalConsoleLog; // Restore original console.log
            setOutput(prev => prev + 'Execution Output:\n' + consoleOutput.join('\n'));

        } catch (e) {
            setOutput(prev => prev + 'Error during dry run:\n' + e.message);
        }
    };

    // Basic canvas drawing for future visualization
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            ctx.fillStyle = '#e0e7ff'; // Light blue background for canvas
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = '16px Inter, sans-serif';
            ctx.fillStyle = '#374151';
            ctx.textAlign = 'center';
            ctx.fillText('Visualization Area (Future Animations Here)', canvas.width / 2, canvas.height / 2);
        }
    }, []); // Run once on mount

    return (
        <div className="p-4 bg-white rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Code Visualizer</h2>

            <div className="mb-4">
                <label htmlFor="language-select" className="block text-gray-700 text-sm font-bold mb-2">
                    Select Language:
                </label>
                <select
                    id="language-select"
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python (Syntax Highlighting Only)</option>
                    <option value="java">Java (Syntax Highlighting Only)</option>
                    <option value="csharp">C# (Syntax Highlighting Only)</option>
                    <option value="cpp">C++ (Syntax Highlighting Only)</option>
                    {/* Add more languages as needed for syntax highlighting */}
                </select>
            </div>

            <div className="mb-6 border rounded-lg overflow-hidden shadow-sm">
                <Editor
                    height="400px" // Set a fixed height for the editor
                    language={language}
                    value={code}
                    theme="vs-light" // Or "vs-dark"
                    onChange={handleEditorChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true, // Important for responsiveness
                    }}
                />
            </div>

            <div className="flex justify-center mb-6 space-x-4">
                <button
                    onClick={runDryRun}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Run Dry Run
                </button>
                {/* Future: Add a button for "Visualize Algorithm" */}
            </div>

            {/* Output Area */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Output:</h3>
                <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-auto text-sm min-h-[100px] max-h-[200px]">
                    {output || 'Run your code to see output here...'}
                </pre>
            </div>

            {/* Canvas for Visualizations */}
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Algorithm Visualization:</h3>
                <canvas
                    ref={canvasRef}
                    width={800} // Initial width, can be made responsive with JS
                    height={400} // Initial height, can be made responsive with JS
                    className="border border-gray-300 rounded-lg w-full"
                ></canvas>
                <p className="text-gray-500 text-sm mt-2 text-center">
                    (This area will show animations of algorithms like sorting, recursion, etc.)
                </p>
            </div>
        </div>
    );
}

export { CodeVisualizer };
