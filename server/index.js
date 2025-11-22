const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

const net = require('net');

// Rate limiting: simple in-memory store
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute per IP

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const record = requestCounts.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      record.count++;
      if (record.count > RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      }
    }
  }
  next();
};

// Clean up old rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 300000);

app.use(rateLimiter);

// Basic HTTP Ping & Proxy Ping
app.get('/ping', (req, res) => {
  const { host, port } = req.query;

  if (host) {
    const start = Date.now();
    const targetPort = parseInt(port) || 443;
    const socket = net.connect(targetPort, host, () => {
      const rtt = Date.now() - start;
      socket.end();
      res.json({ rtt, t_server: Date.now(), host, port: targetPort });
    });

    socket.on('error', (err) => {
      res.status(500).json({ error: 'Ping failed', details: err.message });
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      res.status(408).json({ error: 'Timeout' });
    });
  } else {
    res.json({ server_time: Date.now() });
  }
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Echo Server with rate limiting
const wsConnections = new Map();
const WS_RATE_LIMIT = 50; // messages per connection per minute

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  const connectionId = `${ip}-${Date.now()}`;
  
  wsConnections.set(connectionId, { count: 0, resetTime: Date.now() + RATE_LIMIT_WINDOW });
  
  ws.on('message', (message) => {
    try {
      // Rate limit check
      const now = Date.now();
      const record = wsConnections.get(connectionId);
      
      if (record) {
        if (now > record.resetTime) {
          record.count = 1;
          record.resetTime = now + RATE_LIMIT_WINDOW;
        } else {
          record.count++;
          if (record.count > WS_RATE_LIMIT) {
            ws.send(JSON.stringify({ error: 'Rate limit exceeded' }));
            return;
          }
        }
      }
      
      const data = JSON.parse(message);
      const t_server_recv = Date.now();
      
      // Echo back with server timestamps
      ws.send(JSON.stringify({
        ...data,
        t_server: Date.now(),
        t_server_recv
      }));
    } catch (e) {
      console.error('Invalid JSON:', message);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    wsConnections.delete(connectionId);
  });
});

server.listen(port, () => {
  console.log(`Probe server running on port ${port}`);
  console.log(`HTTP endpoint: http://localhost:${port}/ping`);
  console.log(`WebSocket endpoint: ws://localhost:${port}`);
  console.log('Rate limiting enabled: 100 req/min per IP (HTTP), 50 msg/min (WebSocket)');
});
