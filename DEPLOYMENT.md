# Deploying to Vercel

This guide walks you through deploying the Valorant Ping Checker to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works)
- Git repository (optional, but recommended)
- Vercel CLI installed (optional, for CLI deployment)

## Deployment Methods

### Method 1: Vercel Dashboard (Recommended for First-Time)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`

3. **Configure Project** (if needed):
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install --prefix client && npm install --prefix server`

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

---

### Method 2: Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   cd e:\valoproject
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (for first deployment)
   - What's your project's name? Enter a name or press Enter
   - In which directory is your code located? **./`** (press Enter)
   - Want to override the settings? **N** (vercel.json will be used)

5. **Production Deployment**:
   ```bash
   vercel --prod
   ```

---

## Post-Deployment

### Testing Your Deployment

1. Visit your deployed URL (e.g., `https://your-project-name.vercel.app`)
2. Click "CHECK MY PING" button
3. Verify that all regions show ping results
4. Check browser console for any errors

### Testing API Endpoint Directly

```bash
curl "https://your-project-name.vercel.app/api/ping?host=dynamodb.us-east-1.amazonaws.com&port=443"
```

Expected response:
```json
{
  "rtt": 45,
  "t_server": 1700000000000,
  "host": "dynamodb.us-east-1.amazonaws.com",
  "port": 443
}
```

---

## Local Development

For local development, you still need to run the backend server separately:

1. **Start the backend**:
   ```bash
   cd server
   node index.js
   ```

2. **Start the frontend** (in a new terminal):
   ```bash
   cd client
   npm run dev
   ```

The Vite dev server will proxy `/api` requests to `http://localhost:3001` automatically.

---

## Troubleshooting

### Build Fails

- Check the build logs in Vercel dashboard
- Ensure all dependencies are listed in `package.json`
- Verify TypeScript has no errors: `cd client && npm run build`

### API Not Working

- Check that `/api/ping.js` exists in the deployment
- Verify CORS headers are set correctly
- Check Vercel function logs in the dashboard

### Slow Cold Starts

- Vercel serverless functions have cold starts (~1-2 seconds)
- First ping request may be slower than subsequent ones
- This is normal for serverless architecture

---

## Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Environment Variables (If Needed)

If you need to add environment variables:

1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Add variables (e.g., `API_KEY`, `NODE_ENV`)
3. Redeploy for changes to take effect

---

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main` branch (production)
- Create preview deployments for pull requests
- Run builds and show deployment status in GitHub

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
