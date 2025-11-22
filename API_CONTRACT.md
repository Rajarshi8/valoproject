# API Contract

This document defines the API contract for the Valorant Ping Checker probe servers.

## Overview

The probe server provides two main interfaces for network latency measurement:
1. **HTTP REST API** - Simple request/response ping measurement
2. **WebSocket API** - Low-latency bidirectional ping/pong

## Base URLs

- **Local Development**: `http://localhost:3001`
- **Production**: Varies by deployment (e.g., `https://probe-na.yourdomain.com`)

## HTTP REST API

### Endpoint: `GET /ping`

Measures network latency via TCP connection establishment.

#### Request

**Without proxy (server timestamp only):**
```http
GET /ping HTTP/1.1
Host: localhost:3001
```

**With proxy (ping remote host):**
```http
GET /ping?host=ec2.us-east-1.amazonaws.com&port=443 HTTP/1.1
Host: localhost:3001
```

#### Query Parameters

| Parameter | Type   | Required | Default | Description                                    |
|-----------|--------|----------|---------|------------------------------------------------|
| `host`    | string | No       | -       | Target hostname or IP to ping                  |
| `port`    | string | No       | 443     | Target port number                             |

#### Response

**Success (without proxy):**
```json
{
  "server_time": 1700650245123
}
```

**Success (with proxy):**
```json
{
  "rtt": 45,
  "t_server": 1700650245150,
  "host": "ec2.us-east-1.amazonaws.com",
  "port": 443
}
```

**Error (ping failed):**
```json
{
  "error": "Ping failed",
  "details": "getaddrinfo ENOTFOUND invalid-host.com"
}
```

**Error (timeout):**
```json
{
  "error": "Timeout"
}
```

**Error (rate limit):**
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

#### Status Codes

| Code | Description                                    |
|------|------------------------------------------------|
| 200  | Success                                        |
| 408  | Request timeout (>5 seconds)                   |
| 429  | Too Many Requests (rate limit exceeded)        |
| 500  | Internal server error (connection failed)      |

#### Response Fields

| Field       | Type   | Description                                           |
|-------------|--------|-------------------------------------------------------|
| `server_time` | number | Unix timestamp (ms) when server processed request   |
| `rtt`       | number | Round-trip time in milliseconds (proxy mode only)     |
| `host`      | string | Echoed back target hostname (proxy mode only)         |
| `port`      | number | Echoed back target port (proxy mode only)             |
| `error`     | string | Error message if request failed                       |
| `details`   | string | Additional error information                          |

#### Example Usage

**JavaScript (Fetch):**
```javascript
// Direct server ping
const response = await fetch('http://localhost:3001/ping');
const data = await response.json();
console.log('Server time:', data.server_time);

// Proxy ping
const response = await fetch('http://localhost:3001/ping?host=google.com&port=443');
const data = await response.json();
console.log('RTT to google.com:', data.rtt, 'ms');
```

**cURL:**
```bash
# Direct
curl http://localhost:3001/ping

# Proxy
curl "http://localhost:3001/ping?host=google.com&port=443"
```

**Python:**
```python
import requests

# Direct
response = requests.get('http://localhost:3001/ping')
print(response.json())

# Proxy
response = requests.get('http://localhost:3001/ping', params={
    'host': 'google.com',
    'port': '443'
})
print(f"RTT: {response.json()['rtt']}ms")
```

## WebSocket API

### Endpoint: `ws://localhost:3001`

Low-latency bidirectional communication for ping measurements.

#### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected to probe server');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from probe server');
};
```

#### Message Protocol

**Client → Server (Ping):**
```json
{
  "type": "ping",
  "id": 1,
  "t0": 1700650245000
}
```

**Server → Client (Pong):**
```json
{
  "type": "ping",
  "id": 1,
  "t0": 1700650245000,
  "t_server": 1700650245025,
  "t_server_recv": 1700650245024
}
```

**Server → Client (Error):**
```json
{
  "error": "Rate limit exceeded"
}
```

OR

```json
{
  "error": "Invalid message format"
}
```

#### Message Fields

**Client Request:**

| Field  | Type   | Required | Description                                    |
|--------|--------|----------|------------------------------------------------|
| `type` | string | Yes      | Message type (always "ping")                   |
| `id`   | number | Yes      | Unique identifier for matching request/response|
| `t0`   | number | Yes      | Client timestamp when ping was sent (ms)       |

**Server Response:**

| Field          | Type   | Description                                           |
|----------------|--------|-------------------------------------------------------|
| `type`         | string | Echoed message type                                   |
| `id`           | number | Echoed request ID                                     |
| `t0`           | number | Echoed client timestamp                               |
| `t_server`     | number | Server timestamp when response was sent (ms)          |
| `t_server_recv`| number | Server timestamp when request was received (ms)       |
| `error`        | string | Error message if request failed                       |

#### RTT Calculation

```javascript
const t0 = Date.now();
ws.send(JSON.stringify({ type: 'ping', id: 1, t0 }));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const t1 = Date.now();
  const rtt = t1 - data.t0; // Total round-trip time
  
  console.log(`RTT: ${rtt}ms`);
  console.log(`Server processing time: ${data.t_server - data.t_server_recv}ms`);
};
```

#### Example Usage

**Full WebSocket Ping Test:**
```javascript
const ws = new WebSocket('ws://localhost:3001');
const results = [];

ws.onopen = async () => {
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    ws.send(JSON.stringify({ type: 'ping', id: i, t0 }));
    
    await new Promise(resolve => {
      const handler = (event) => {
        const t1 = performance.now();
        const data = JSON.parse(event.data);
        if (data.id === i) {
          results.push(t1 - t0);
          ws.removeEventListener('message', handler);
          resolve();
        }
      };
      ws.addEventListener('message', handler);
    });
    
    await new Promise(r => setTimeout(r, 100)); // Wait 100ms between pings
  }
  
  const avg = results.reduce((a, b) => a + b) / results.length;
  console.log(`Average RTT: ${avg.toFixed(2)}ms`);
  ws.close();
};
```

## Rate Limiting

### HTTP Endpoint
- **Limit**: 100 requests per minute per IP address
- **Window**: 60 seconds (rolling)
- **Response**: 429 Too Many Requests
- **Headers**: None (rate limit info not exposed)

### WebSocket Endpoint
- **Limit**: 50 messages per minute per connection
- **Window**: 60 seconds (rolling)
- **Response**: JSON error message `{"error": "Rate limit exceeded"}`
- **Action**: Connection remains open, but messages rejected

### Implementation

Rate limiting is IP-based and uses an in-memory store. Limits reset after the window expires.

**Bypassing rate limits** (for testing only):
```javascript
// server/index.js
const RATE_LIMIT_MAX = 1000; // Increase limit
const RATE_LIMIT_WINDOW = 60000; // Or increase window
```

## CORS Configuration

### Allowed Origins
- `*` (all origins permitted)

### Allowed Methods
- `GET`, `OPTIONS`

### Allowed Headers
- `Content-Type`
- `Authorization`
- Any custom headers

### Credentials
- Not supported (Access-Control-Allow-Credentials: false)

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": "Brief error description",
  "details": "Optional detailed error message"
}
```

### Common Errors

| Error                    | Cause                                          | Solution                          |
|--------------------------|------------------------------------------------|-----------------------------------|
| Timeout                  | Target host took >5s to respond                | Try again or check host           |
| Ping failed              | Cannot resolve hostname or connect             | Verify hostname and network       |
| Rate limit exceeded      | Too many requests in short time                | Wait 60 seconds                   |
| Invalid message format   | Malformed JSON sent to WebSocket               | Check JSON syntax                 |
| Connection timeout       | WebSocket handshake timeout                    | Check network connectivity        |

## Health Checks

### HTTP Health Check

```bash
curl http://localhost:3001/ping
```

If server responds with `{"server_time": ...}`, it's healthy.

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3001/ping', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
```

## Performance Characteristics

### HTTP Endpoint
- **Latency**: ~1-3ms (local), varies by network
- **Throughput**: ~100 req/s (rate limited)
- **Timeout**: 5 seconds

### WebSocket Endpoint
- **Latency**: <1ms (local), varies by network
- **Throughput**: ~50 msg/s (rate limited)
- **Idle timeout**: None (connection stays open)

## Security Considerations

1. **No Authentication**: Endpoints are public
2. **Rate Limiting**: Prevents abuse
3. **Timeout Protection**: Prevents hanging connections
4. **Input Validation**: Host/port parameters validated
5. **CORS**: Wide open (suitable for public service)
6. **DoS Protection**: Rate limiting + timeouts

**Recommendations for production:**
- Add API key authentication
- Implement stricter CORS policy
- Use HTTPS/WSS with valid certificates
- Add request logging and monitoring
- Implement IP whitelisting if needed

## Versioning

**Current Version**: 1.0.0

API is not versioned. Breaking changes will be documented in release notes.

## Support

For issues or questions:
- Check troubleshooting guide in README.md
- Review this API contract
- Submit GitHub issue with request/response examples
