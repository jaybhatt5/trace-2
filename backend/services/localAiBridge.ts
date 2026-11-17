import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import http from 'http';

const AI_ENGINE_PORT = parseInt(process.env.AI_ENGINE_PORT || '5001', 10);
const AI_ENGINE_URL = `http://127.0.0.1:${AI_ENGINE_PORT}`;
const BACKEND_DIR = path.resolve(process.cwd(), 'backend');

export type BridgeLifecycleState =
  | { status: 'stopped' }
  | { status: 'starting'; process: ChildProcess }
  | { status: 'online'; process: ChildProcess | null }
  | { status: 'cli-fallback'; reason?: string };

let bridgeState: BridgeLifecycleState = { status: 'stopped' };

export const getAiBridgeState = () => ({
  status: bridgeState.status,
  hasProcess:
    bridgeState.status === 'starting' ||
    (bridgeState.status === 'online' && bridgeState.process !== null),
});

/**
 * Checks if the local Python AI engine HTTP server is alive
 */
export const checkAiEngineHealth = (): Promise<any> => {
  return new Promise((resolve) => {
    const req = http.get(`${AI_ENGINE_URL}/health`, { timeout: 1500 }, (res) => {
      if (res.statusCode === 200) {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
};

/**
 * Starts the Python AI engine microservice in the background if not already running
 */
export const ensureAiEngineRunning = async (): Promise<boolean> => {
  const existing = await checkAiEngineHealth();
  if (existing) {
    bridgeState = {
      status: 'online',
      process:
        bridgeState.status === 'starting' || bridgeState.status === 'online'
          ? bridgeState.process
          : null,
    };
    return true;
  }

  if (bridgeState.status === 'starting') {
    return false;
  }

  try {
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const child = spawn(pythonExe, ['-m', 'ai_engine.server'], {
      cwd: BACKEND_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, AI_ENGINE_PORT: String(AI_ENGINE_PORT) },
      detached: false,
    });

    bridgeState = { status: 'starting', process: child };

    child.stdout?.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) console.info(`[TRACE Local AI] ${msg}`);
    });

    child.stderr?.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg && !msg.includes('WARN')) console.warn(`[TRACE Local AI] ${msg}`);
    });

    child.on('exit', (code) => {
      console.info(`[TRACE Local AI] Service exited with code ${code}`);
      bridgeState = { status: 'cli-fallback', reason: `Exited with code ${code}` };
    });

    // Wait up to 6 seconds for server to bind
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const health = await checkAiEngineHealth();
      if (health) {
        console.info(`[TRACE Local AI] Service online on port ${AI_ENGINE_PORT}.`);
        bridgeState = { status: 'online', process: child };
        return true;
      }
    }
  } catch (err: any) {
    console.warn('[TRACE Local AI] Could not spawn daemon process:', err);
    bridgeState = { status: 'cli-fallback', reason: err?.message || 'Spawn error' };
    return false;
  }

  bridgeState = { status: 'cli-fallback', reason: 'HTTP bind timeout' };
  return false;
};

/**
 * Fallback direct CLI invocation via child_process.spawn
 */
const runAiCli = (command: string, payload: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const child = spawn(pythonExe, ['-m', 'ai_engine.cli', command, '-'], {
      cwd: BACKEND_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (c) => (stdout += c));
    child.stderr.on('data', (c) => (stderr += c));

    child.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.success && parsed.result) {
            resolve(parsed.result);
          } else if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Invalid JSON output from Python CLI: ${stdout.slice(0, 200)}`));
        }
      } else {
        reject(new Error(stderr || `Python CLI exited with code ${code}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
};

/**
 * Dispatches an AI request: tries HTTP endpoint first, falls back to direct CLI execution
 */
export const dispatchLocalAiRequest = async (
  endpoint: string,
  cliCommand: string,
  payload: any
): Promise<any> => {
  const isHealthy = await checkAiEngineHealth();
  if (isHealthy) {
    try {
      const postData = JSON.stringify(payload);
      return await new Promise((resolve, reject) => {
        const req = http.request(
          `${AI_ENGINE_URL}${endpoint}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
              'X-Internal-AI-Token': process.env.AI_ENGINE_INTERNAL_TOKEN || 'trace-internal-ai-bridge-local',
            },
            timeout: 60000,
          },
          (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (parsed.success && parsed.result) {
                  resolve(parsed.result);
                } else if (parsed.detail) {
                  reject(new Error(parsed.detail));
                } else {
                  resolve(parsed);
                }
              } catch (err) {
                reject(err);
              }
            });
          }
        );

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Local AI HTTP request timed out.'));
        });
        req.write(postData);
        req.end();
      });
    } catch (httpErr) {
      console.warn(`[TRACE Local AI] HTTP request failed, using CLI fallback:`, httpErr);
    }
  }

  return await runAiCli(cliCommand, payload);
};
