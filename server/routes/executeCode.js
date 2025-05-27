// coders-hangout/server/routes/executeCode.js
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util'); // Import util for promisify
const auth = require('../middleware/auth'); // For authenticated access

const execPromise = util.promisify(exec); // Convert exec to a promise-based function

/**
 * @route   POST /api/execute-code
 * @desc    Execute user-provided code
 * @access  Private (auth middleware)
 * IMPORTANT: This is NOT secure for untrusted input in production.
 */
router.post('/', auth, async (req, res) => {
    const { code, language } = req.body;

    if (!code || !language) {
        return res.status(400).json({ msg: 'Code and language are required.' });
    }

    let tempFilePath = '';
    let compiledFilePath = '';
    let executablePath = '';
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 9); // Simple unique ID for temp files
    const tempDir = path.join(__dirname, '../temp');
    const timeout = 5000; // 5 seconds for execution

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    try {
        let command = '';
        let initialCode = code; // The raw code from the user

        if (language === 'javascript') {
            tempFilePath = path.join(tempDir, `${uniqueId}.js`);
            fs.writeFileSync(tempFilePath, initialCode);
            command = `node ${tempFilePath}`;

            const { stdout, stderr } = await execPromise(command, { timeout });
            if (stderr) {
                return res.status(400).json({ output: stderr, error: 'Runtime Error' });
            }
            return res.json({ output: stdout });

        } else if (language === 'python') {
            tempFilePath = path.join(tempDir, `${uniqueId}.py`);
            fs.writeFileSync(tempFilePath, initialCode);
            command = `python ${tempFilePath}`;

            const { stdout, stderr } = await execPromise(command, { timeout });
            if (stderr) {
                return res.status(400).json({ output: stderr, error: 'Runtime Error' });
            }
            return res.json({ output: stdout });

        } else if (language === 'java') {
            const className = 'Solution'; // We'll enforce the class name to be Solution for simplicity
            tempFilePath = path.join(tempDir, `${className}.java`); // Use fixed class name for Java file
            compiledFilePath = path.join(tempDir, `${className}.class`);

            // Wrap user's code into a main class structure if it's just raw code
            if (!initialCode.includes(`public class ${className}`)) {
                initialCode = `
public class ${className} {
    public static void main(String[] args) {
        // Your code goes here
        ${initialCode}
    }
}
                `;
            }
            fs.writeFileSync(tempFilePath, initialCode);

            // Compile Java code
            try {
                await execPromise(`javac ${tempFilePath}`, { timeout }); // Compilation timeout
            } catch (compileErr) {
                return res.status(400).json({ output: compileErr.stderr || compileErr.message, error: 'Compilation Error (Java)' });
            }

            // Execute Java code from the temp directory
            command = `java -cp ${tempDir} ${className}`;
            const { stdout, stderr } = await execPromise(command, { timeout });
            if (stderr) {
                return res.status(400).json({ output: stderr, error: 'Runtime Error (Java)' });
            }
            return res.json({ output: stdout });

        } else if (language === 'cpp') {
            tempFilePath = path.join(tempDir, `${uniqueId}.cpp`);
            executablePath = path.join(tempDir, `${uniqueId}.out`); // For Linux/macOS
            // On Windows, you might want `${uniqueId}.exe` and adjust commands
            // For cross-platform stability, .out is fine for demonstration.

            fs.writeFileSync(tempFilePath, initialCode);

            // Compile C++ code
            try {
                await execPromise(`g++ ${tempFilePath} -o ${executablePath}`, { timeout }); // Compilation timeout
            } catch (compileErr) {
                return res.status(400).json({ output: compileErr.stderr || compileErr.message, error: 'Compilation Error (C++)' });
            }

            // Execute C++ code
            command = `${executablePath}`; // On Windows, might need `.\\${executablePath}`
            const { stdout, stderr } = await execPromise(command, { timeout });
            if (stderr) {
                return res.status(400).json({ output: stderr, error: 'Runtime Error (C++)' });
            }
            return res.json({ output: stdout });

        } else {
            return res.status(400).json({ msg: 'Unsupported language for execution.' });
        }
    } catch (err) {
        console.error('Error during code execution:', err);
        // Handle timeout error specifically
        if (err.killed && err.signal === 'SIGTERM') {
            return res.status(408).json({ output: `Execution timed out (${timeout / 1000} seconds limit). Possible infinite loop or long running code.`, error: 'Timeout' });
        }
        res.status(500).json({ msg: 'Server error during code execution.', error: err.message || 'Unknown server error.' });
    } finally {
        // Clean up all temporary files created during this request
        const filesToDelete = [tempFilePath, compiledFilePath, executablePath];
        filesToDelete.forEach(file => {
            if (file && fs.existsSync(file)) {
                try {
                    fs.unlinkSync(file);
                } catch (cleanupErr) {
                    console.error(`Error deleting temp file ${file}:`, cleanupErr.message);
                }
            }
        });

        // For Java, also specifically delete the .class file if it was created
        if (language === 'java' && compiledFilePath && fs.existsSync(compiledFilePath)) {
            try {
                fs.unlinkSync(compiledFilePath);
            } catch (cleanupErr) {
                console.error(`Error deleting Java class file ${compiledFilePath}:`, cleanupErr.message);
            }
        }
    }
});

module.exports = router;
