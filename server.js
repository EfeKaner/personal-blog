const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const rootDir = __dirname;
const port = process.env.PORT || 3000;
const clients = new Set();
let latestState = null;

function serveFile(filePath, response) {
  const resolvedPath = path.join(rootDir, filePath);
  fs.readFile(resolvedPath, (error, content) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not found');
      return;
    }

    const ext = path.extname(resolvedPath);
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
      '.svg': 'image/svg+xml'
    }[ext] || 'application/octet-stream';

    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  });
}

const server = http.createServer((req, res) => {
  const requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];

  if (requestPath === '/ws') {
    res.writeHead(426, { 'Upgrade': 'WebSocket' });
    res.end();
    return;
  }

  serveFile(requestPath, res);
});

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (socket) => {
  clients.add(socket);

  if (latestState) {
    socket.send(JSON.stringify({ type: 'state', state: latestState }));
  }

  socket.on('message', (rawMessage) => {
    try {
      const payload = JSON.parse(rawMessage.toString());

      if (payload?.type === 'update' && payload.state) {
        latestState = payload.state;
        const message = JSON.stringify({ type: 'state', state: latestState });
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }

      if (payload?.type === 'request-state') {
        if (latestState) {
          socket.send(JSON.stringify({ type: 'state', state: latestState }));
        }
      }
    } catch (error) {
      console.error('Invalid sync payload:', error);
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
  });
});

server.listen(port, () => {
  console.log(`Blog sync server running on http://localhost:${port}`);
});
