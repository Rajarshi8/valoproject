# Valorant Ping Checker ⚡

A production-ready, web-based network latency checker designed for Valorant players. Measure your ping (RTT), jitter, and packet loss to all major Valorant server regions with a sleek, game-inspired interface.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2-61dafb.svg)

## ✨ Features

### 🎯 Comprehensive Network Testing
- **Multi-Region Support**: Test latency to 6 Valorant regions (NA, EU, KR, BR, LATAM, AP)
- **Detailed Metrics**: RTT (min/avg/max), jitter, and packet loss percentage
- **Real-Time Updates**: Live progress bars and animated visualizations
- **Accurate Measurements**: TCP-based pings via proxy server to AWS endpoints co-located with Valorant servers

### 🎨 Premium User Interface
- **Valorant-Inspired Design**: Dark theme with signature red accents and angular elements
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Interactive Visualizations**: Sparkline charts showing latency variation
- **Status Indicators**: Color-coded badges (Excellent/Moderate/Poor)

### 📊 Smart Analysis
- **Best Region Recommendation**: Automatically identifies optimal server
- **Playability Status**: Clear guidance on connection quality
  - 🟢 Excellent: <80ms
  - 🟡 Moderate: 80-150ms
  - 🔴 Poor: >150ms
- **Performance Tips**: Suggestions to improve your connection

### 🔄 Export & Share
- **JSON Reports**: Download detailed test results
- **Share Text**: Copy formatted results to clipboard
- **Historical Data**: Test metadata with timestamps

### ♿ Accessibility First
- **Keyboard Navigation**: Full Tab/Enter/Space support
- **Screen Reader Friendly**: ARIA labels and live regions
- **High Contrast**: WCAG AA compliant colors
- **Focus Indicators**: Clear visual feedback

### 🔒 Security & Privacy
- **No Data Collection**: All tests run client-side
- **Rate Limiting**: 100 requests/min per IP (HTTP), 50 msg/min (WebSocket)
- **Privacy Notice**: Transparent about minimal logging
- **Client-Side Processing**: Results stay on your device

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd valoproject
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

### Running Locally

**Terminal 1 - Backend Server:**
```bash
cd server
node index.js
```
Server runs on `http://localhost:3001`

**Terminal 2 - Frontend Client:**
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173`

**Open your browser** and navigate to [http://localhost:5173](http://localhost:5173)

## 🏗️ Architecture

### How It Works

Browsers cannot directly ping IP addresses due to security restrictions. This app solves that with a proxy architecture:

```
User Browser → Local Backend Proxy → Target AWS Endpoints → Response
                     ↓
                Measure RTT
```

1. **Frontend** sends request to local backend (`/api/ping?host=...`)
2. **Backend** establishes TCP connection to target (e.g., `ec2.us-east-1.amazonaws.com`)
3. **TCP Handshake Time** is measured and returned as RTT
4. **Frontend** runs 10 probes per region and calculates statistics

### Tech Stack

#### Frontend (`/client`)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3.4
- **State**: React Hooks
- **HTTP Client**: Fetch API

#### Backend (`/server`)
- **Runtime**: Node.js 18
- **Framework**: Express 5
- **WebSocket**: ws library
- **CORS**: cors middleware

## 🌍 Deployment

### Option 1: Vercel (Serverless - Recommended)

Deploy to Vercel's Edge Network for global low-latency pings:

```bash
npm install -g vercel
vercel --prod
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Option 2: Docker

Run both frontend and backend with Docker Compose:

```bash
docker-compose up -d
```

Visit `http://localhost:5173`

### Option 3: Multi-Region Probes

For production accuracy, deploy probe servers across multiple regions. See [MULTI_REGION_DEPLOYMENT.md](MULTI_REGION_DEPLOYMENT.md) for complete guide.

**Estimated cost:** $3-6/month per region

## 📝 API Documentation

### HTTP Endpoint

**GET /ping**
```
Query Params:
  - host (optional): Target hostname
  - port (optional): Target port (default: 443)

Response:
  - Without host: {"server_time": 1700000000}
  - With host: {"rtt": 45, "t_server": 1700000000, "host": "...", "port": 443}
```

### WebSocket Endpoint

**ws://localhost:3001**
```
Send: {"type":"ping","id":1,"t0":1700000000}
Receive: {"type":"ping","id":1,"t0":1700000000,"t_server":1700000025,"t_server_recv":1700000024}
```

## 🐛 Troubleshooting

### Backend Not Starting
```bash
# Check port availability
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <pid> /F
```

### CORS Errors
- Ensure backend is running on port 3001
- Check Vite proxy config in `vite.config.ts`
- Verify CORS headers in server response

### High Latency
- Test your internet connection
- Close bandwidth-heavy apps
- Try different region
- Check firewall/antivirus

### Rate Limit Errors
- Wait 1 minute
- Reduce probe count in code
- Increase `RATE_LIMIT_MAX` in `server/index.js`

## ⚠️ Disclaimer

This project is **not affiliated with Riot Games**. Valorant is a trademark of Riot Games, Inc. This tool is an independent network testing utility inspired by Valorant's aesthetic.

## 📄 License

ISC
