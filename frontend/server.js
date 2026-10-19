/**
 * Placify AI — Standalone Frontend Static SPA Server
 * Serves the Placify frontend application independently.
 * Default Port: 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const INITIAL_PORT = parseInt(process.env.PORT || process.env.FRONTEND_PORT, 10) || 3001;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Prevent directory traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      return fs.createReadStream(filePath).pipe(res);
    }

    // SPA routing fallback: serve index.html for client-side routes
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    fs.readFile(indexPath, (indexErr, content) => {
      if (indexErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('File not found');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
  });
});

let currentPort = INITIAL_PORT;

function startServer(port) {
  server.listen(port, () => {
    console.log('==========================================');
    console.log(`🌐 Placify Frontend running at: http://localhost:${port}`);
    console.log(`📡 Connected Backend API at:    http://localhost:5000`);
    console.log('==========================================');
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Port ${currentPort} is currently in use. Automatically trying port ${currentPort + 1}...`);
    currentPort++;
    setTimeout(() => {
      startServer(currentPort);
    }, 150);
  } else {
    console.error('❌ Frontend server error:', err);
    process.exit(1);
  }
});

startServer(currentPort);

module.exports = server;
