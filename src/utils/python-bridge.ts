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
    // Use Python from environment or system python3
    // Render installs packages globally, no venv needed
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const projectRoot = path.join(__dirname, '../..');

    // Convert 'dashboard.py' to 'scripts.analysis.dashboard' for module execution
    const moduleName = `scripts.analysis.${scriptName.replace('.py', '')}`;

    // Run as module: python -m scripts.analysis.dashboard
    // Add user site-packages to Python path for Render (Python 3.13.4)
    const pythonUserBase = process.env.PYTHONUSERBASE || '/opt/render/project/.python_packages';
    const python = spawn(pythonPath, ['-m', moduleName, ...args], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PYTHONPATH: `${projectRoot}:${pythonUserBase}/lib/python3.13/site-packages`,
        PYTHONUSERBASE: pythonUserBase
      }
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
