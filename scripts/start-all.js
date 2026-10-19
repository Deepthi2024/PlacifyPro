/**
 * Placify AI — Root Dev Orchestrator
 * Starts both Backend (port 5000) and Frontend (port 3000) concurrently.
 */

const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend');
const frontendDir = path.join(root, 'frontend');

// Load .env from root or backend
try {
  require('dotenv').config({ path: path.join(root, '.env') });
} catch (e) {}
if (!process.env.MONGODB_URI) {
  try {
    require('dotenv').config({ path: path.join(backendDir, '.env') });
  } catch (e) {}
}

const frontendPort = process.env.FRONTEND_PORT || '3001';

console.log('====================================================');
console.log('🚀 Starting Placify AI Services...');
console.log(`Backend: http://localhost:${process.env.PORT || '5000'}`);
console.log(`Frontend: http://localhost:${frontendPort}`);
console.log('====================================================\n');

// 1. Start Backend
const backend = spawn('node', ['server.js'], {
  cwd: backendDir,
  env: Object.assign({}, process.env, { PORT: process.env.PORT || '5000' }),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`[BACKEND] ${data.toString()}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`[BACKEND ERR] ${data.toString()}`);
});

backend.on('error', (err) => {
  console.error('[BACKEND PROCESS ERROR]', err.message);
});

backend.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    console.error(`[BACKEND EXITED] code: ${code}, signal: ${signal}`);
  }
});

// 2. Start Frontend
const frontend = spawn('node', ['server.js'], {
  cwd: frontendDir,
  env: Object.assign({}, process.env, { PORT: frontendPort }),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`[FRONTEND] ${data.toString()}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`[FRONTEND ERR] ${data.toString()}`);
});

frontend.on('error', (err) => {
  console.error('[FRONTEND PROCESS ERROR]', err.message);
});

frontend.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    console.error(`[FRONTEND EXITED] code: ${code}, signal: ${signal}`);
  }
});

function cleanup() {
  console.log('\n🛑 Shutting down Placify services...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
