import { spawn } from 'child_process';
import path from 'path';

/**
 * Execute a Python analysis script and return its JSON output
 *
 * @param scriptName - Name of the Python script (e.g., 'dashboard.py')
 * @param args - Command-line arguments to pass to the script
 * @returns Promise resolving to parsed JSON output
 */
export async function runPythonScript(
  scriptName: string,
  args: string[] = []
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    // Use venv Python by default
    const pythonPath = process.env.PYTHON_PATH || path.join(__dirname, '../../venv/bin/python3');
    const projectRoot = path.join(__dirname, '../..');

    // Convert 'dashboard.py' to 'scripts.analysis.dashboard' for module execution
    const moduleName = `scripts.analysis.${scriptName.replace('.py', '')}`;

    // Run as module: python -m scripts.analysis.dashboard
    const python = spawn(pythonPath, ['-m', moduleName, ...args], {
      cwd: projectRoot,
      env: { ...process.env, PYTHONPATH: projectRoot }
    });

    let dataString = '';
    let errorString = '';

    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        const errorMessage = errorString || `Python script exited with code ${code}`;
        console.error('Python script error:', errorMessage);
        reject(new Error(errorMessage));
      } else {
        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (e) {
          console.error('Failed to parse Python output:', dataString);
          reject(new Error(`Failed to parse Python output: ${dataString.substring(0, 200)}`));
        }
      }
    });

    python.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}
