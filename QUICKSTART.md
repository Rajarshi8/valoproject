# Quick Start Guide

Get the Valorant Ping Checker running in under 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm installed (`npm --version`)
- ✅ Git installed (optional, for cloning)

Don't have Node.js? [Download it here](https://nodejs.org/)

## Installation (2 minutes)

### Step 1: Get the Code

**Option A - Clone from Git:**
```bash
git clone <repository-url>
cd valoproject
```

**Option B - Download ZIP:**
1. Download and extract the ZIP file
2. Open terminal in the extracted folder

### Step 2: Install Dependencies

**Windows (PowerShell):**
```powershell
cd server; npm install; cd ..; cd client; npm install; cd ..
```

**macOS/Linux (Bash):**
```bash
cd server && npm install && cd ../client && npm install && cd ..
```

That's it! Installation complete. ✅

## Running the App (1 minute)

You need **two terminal windows** - one for backend, one for frontend.

### Terminal 1: Start Backend

```bash
cd server
node index.js
```

**Expected output:**
```
Probe server running on port 3001
HTTP endpoint: http://localhost:3001/ping
WebSocket endpoint: ws://localhost:3001
Rate limiting enabled: 100 req/min per IP (HTTP), 50 msg/min (WebSocket)
```

✅ Backend is running! Keep this terminal open.

### Terminal 2: Start Frontend

Open a **new terminal window** and run:

```bash
cd client
npm run dev
```

**Expected output:**
```
VITE v7.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ Frontend is running!

### Step 3: Open in Browser

Navigate to: **http://localhost:5173**

You should see the Valorant Ping Checker interface! 🎉

## Using the App (1 minute)

### Test All Regions
1. Click the big **"CHECK MY PING"** button
2. Wait 15-20 seconds as it tests all 6 regions
3. View your results with RTT, jitter, and packet loss
4. See the best region recommendation

### Test Single Region
- Click on any region card to test just that region

### Export Results
- Click **"Download JSON Report"** to save detailed data
- Click **"Share Result"** to copy summary to clipboard

### View Tips
- Click **"Tips"** in the header for ping improvement suggestions

## Troubleshooting

### Backend Won't Start

**Error:** `Port 3001 is already in use`

**Solution (Windows):**
```powershell
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

**Solution (macOS/Linux):**
```bash
lsof -ti:3001 | xargs kill -9
```

### Frontend Shows Blank Page

**Problem:** Backend not running

**Solution:**
1. Check Terminal 1 - is backend still running?
2. Try accessing http://localhost:3001/ping directly
3. If you see `{"server_time": ...}`, backend is working
4. Refresh the frontend page

### CORS Errors in Console

**Problem:** Wrong backend URL

**Solution:**
1. Verify backend is on port 3001
2. Check `client/vite.config.ts` proxy settings
3. Restart both servers

### Tests Failing

**Problem:** Network connectivity issues

**Solution:**
1. Check your internet connection
2. Try a single region first
3. Check firewall/antivirus settings
4. Try different target hosts in `App.tsx`

### High Ping on All Regions

**Problem:** Local network congestion

**Solution:**
1. Close other apps using bandwidth (streaming, downloads)
2. Disconnect other devices from WiFi
3. Use wired connection instead of WiFi
4. Try again later

## Next Steps

### Customize Regions

Edit `client/src/App.tsx`:

```typescript
const REGIONS: Region[] = [
  { 
    id: 'custom', 
    name: 'My Custom Region', 
    url: 'http://localhost:3001', 
    host: 'your-server.com', 
    port: '443' 
  },
  // ... more regions
];
```

### Deploy to Production

Choose your deployment method:

**Quick Deploy (Vercel):**
```bash
npm install -g vercel
vercel --prod
```

**Docker:**
```bash
docker-compose up -d
```

**Multi-Region:** See [MULTI_REGION_DEPLOYMENT.md](MULTI_REGION_DEPLOYMENT.md)

## Development Tips

### Auto-Restart on Code Changes

**Backend (using nodemon):**
```bash
npm install -g nodemon
cd server
nodemon index.js
```

**Frontend:** Already has hot reload via Vite! 🔥

### View Network Requests

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "ping"
4. See all ping requests and responses

### Test API Directly

```bash
# Test server ping
curl http://localhost:3001/ping

# Test proxy ping
curl "http://localhost:3001/ping?host=google.com&port=443"

# Test WebSocket (install wscat first: npm i -g wscat)
wscat -c ws://localhost:3001
> {"type":"ping","id":1,"t0":1700000000}
```

### Build for Production

```bash
cd client
npm run build
```

Built files will be in `client/dist/`

## Common Workflows

### Development Workflow
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev

# Make changes, see instant updates!
```

### Production Build & Test
```bash
# Build frontend
cd client && npm run build

# Serve production build (install serve: npm i -g serve)
serve -s dist -p 5173

# Test with production backend
cd ../server && PORT=3001 node index.js
```

### Docker Development
```bash
# Build and run
docker-compose up --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Performance Tips

### Faster Tests
- Reduce probe count: Edit `measureLatency(region, 5)` in App.tsx (default is 10)
- Test regions in parallel: Change `runTests()` to use `Promise.all()`

### Smaller Bundle
- Remove unused Tailwind classes (already optimized)
- Enable Vite build optimizations (already enabled)

### Better Accuracy
- Use wired connection
- Test sequentially (current default)
- Increase probe count for more samples

## Getting Help

Stuck? Here's where to look:

1. **README.md** - Full documentation
2. **API_CONTRACT.md** - API reference
3. **DEPLOYMENT.md** - Deployment guides
4. **ACCEPTANCE_CHECKLIST.md** - Feature validation
5. **GitHub Issues** - Report bugs or ask questions

## Success Checklist

✅ Backend running on port 3001  
✅ Frontend running on port 5173  
✅ Can access http://localhost:5173  
✅ "CHECK MY PING" button works  
✅ At least one region shows results  
✅ Can download JSON report  
✅ Can share results

**All checked?** You're ready to go! 🚀

---

**Enjoy testing your Valorant ping!** For advanced usage, deployment, or customization, see the other documentation files.
