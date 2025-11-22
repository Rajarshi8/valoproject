const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

const net = require('net');

// Basic HTTP Ping & Proxy Ping
app.get('/ping', (req, res) => {
  const { host, port } = req.query;

  if (host) {
    const start = Date.now();
    const socket = net.connect(port || 80, host, () => {
      const rtt = Date.now() - start;
      socket.end();
      res.json({ rtt, t_server: Date.now() });
    });

    socket.on('error', (err) => {
      res.status(500).json({ error: 'Ping failed', details: err.message });
    });

    socket.setTimeout(2000, () => {
      socket.destroy();
      res.status(408).json({ error: 'Timeout' });
    });
  } else {
    res.json({ server_time: Date.now() });
  }
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Echo Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      // Echo back with server timestamps
      ws.send(JSON.stringify({
        ...data,
        t_server: Date.now()
      }));
    } catch (e) {
      console.error('Invalid JSON:', message);
    }
  });
});

server.listen(port, () => {
  console.log(`Probe server running on port ${port}`);
});
