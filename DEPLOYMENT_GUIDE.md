# Deployment Guide - Equity Research AI

## Architecture Overview

Your app has a **separated frontend and backend** architecture:

**Frontend:**
- React + Vite SPA (Single Page Application)
- Firebase Authentication (client-side)
- Deployed as static files

**Backend:**
- Flask Python server (port 5001)
- Server-Sent Events (SSE) for real-time updates
- Firebase Admin SDK for auth verification
- OpenAI Agents, Anthropic, MCP servers
- Must run continuously (not serverless due to SSE)

## Recommended Deployment Strategy

### 🥇 **BEST OPTION: Vercel + Railway**

**Why this is optimal:**
- ✅ Free/cheap to start ($5-10/month total)
- ✅ Easy setup with Git integration
- ✅ Frontend CDN for fast loading worldwide
- ✅ Backend handles SSE perfectly
- ✅ Auto-deploys on git push
- ✅ Good for showcasing online

**Cost:** Free tier (Vercel) + $5/month (Railway)

---

## Step-by-Step Deployment

### Part 1: Deploy Backend (Railway)

**Railway.app is perfect for your Flask backend with SSE support.**

#### 1.1 Prepare Backend

Create `Procfile` in root directory:
```
web: python app.py
```

Create `runtime.txt` in root directory:
```
python-3.11
```

Update `app.py` to use PORT from environment:
```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
```

#### 1.2 Deploy to Railway

1. Go to https://railway.app and sign up (use GitHub)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `equity-research-ai` repository
4. Railway will auto-detect Python and deploy

#### 1.3 Set Environment Variables on Railway

In Railway dashboard → Variables tab, add:
```
OPENAI_API_KEY=your_key_here
BRAVE_API_KEY=your_key_here
FIREBASE_CREDENTIALS=/app/firebase-service-account.json
```

**For Firebase credentials:**
- Option 1: Copy contents of `firebase-service-account.json` and paste as JSON string
- Option 2: Use Railway's file upload feature

#### 1.4 Get Your Backend URL

Railway will give you a URL like: `https://your-app.railway.app`

**Test it:**
```bash
curl https://your-app.railway.app/health
```

---

### Part 2: Deploy Frontend (Vercel)

**Vercel is built for React/Vite apps and gives you instant global CDN.**

#### 2.1 Update Frontend for Production

**Update `frontend/vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/research': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
      },
      '/history': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
```

**Create `frontend/vercel.json`:**
```json
{
  "rewrites": [
    {
      "source": "/research/:path*",
      "destination": "https://your-app.railway.app/research/:path*"
    },
    {
      "source": "/health",
      "destination": "https://your-app.railway.app/health"
    },
    {
      "source": "/history/:path*",
      "destination": "https://your-app.railway.app/history/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Update API calls in your frontend code:**

Find all API calls and use environment variable:
```javascript
// Before:
fetch('/research/stock', ...)

// After:
const API_URL = import.meta.env.VITE_API_URL || '';
fetch(`${API_URL}/research/stock`, ...)
```

#### 2.2 Deploy to Vercel

1. Go to https://vercel.com and sign up (use GitHub)
2. Click "Add New" → "Project"
3. Import your `equity-research-ai` repository
4. **Configure:**
   - Framework Preset: **Vite**
   - Root Directory: **frontend**
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add Environment Variables:**
   ```
   VITE_API_URL=https://your-app.railway.app
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

6. Click "Deploy"

**Your app is now live at:** `https://your-app.vercel.app`

---

## Alternative Deployment Options

### Option 2: AWS (More Scalable)

**Frontend:** S3 + CloudFront
**Backend:** EC2 or App Runner
**Cost:** ~$10-20/month

**Pros:**
- More scalable for production
- Full control
- Better for enterprise

**Cons:**
- More complex setup
- Requires AWS knowledge

### Option 3: DigitalOcean App Platform

**Both frontend and backend on one platform**
**Cost:** ~$12/month

**Pros:**
- Single platform for everything
- Simpler than AWS
- Good value

**Cons:**
- Less flexibility than separate services

### Option 4: Self-Hosted (VPS)

**Use any VPS: DigitalOcean Droplet, Linode, Vultr**
**Cost:** $5-10/month

**Setup:**
1. Install Node.js and Python
2. Use Nginx as reverse proxy
3. PM2 for backend process management
4. Build frontend and serve with Nginx

**Pros:**
- Full control
- Cheapest option
- Good learning experience

**Cons:**
- Manual setup and maintenance
- Need to handle SSL, scaling yourself

---

## Post-Deployment Checklist

### Backend

- ✅ Backend health endpoint working: `/health`
- ✅ CORS configured for your frontend domain
- ✅ Environment variables set (API keys)
- ✅ Firebase credentials uploaded
- ✅ SSE connections work (test with real analysis)

### Frontend

- ✅ Frontend loads and renders
- ✅ Firebase authentication works
- ✅ API calls reach backend
- ✅ Real-time updates (SSE) work
- ✅ All environment variables set

### Firebase

- ✅ Authorized domains added in Firebase Console
  - Add your Vercel domain: `your-app.vercel.app`
  - Firebase Console → Authentication → Settings → Authorized domains
- ✅ Firestore security rules configured
- ✅ Firebase Admin SDK initialized on backend

---

## Environment Variables Reference

### Backend (.env or Railway)
```
OPENAI_API_KEY=sk-...
BRAVE_API_KEY=...
FIREBASE_CREDENTIALS=/path/to/service-account.json
ALPHA_VANTAGE_API_KEY=... (optional)
GEMINI_API_KEY=... (optional)
```

### Frontend (.env or Vercel)
```
VITE_API_URL=https://your-backend.railway.app
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

---

## Continuous Deployment

Both Vercel and Railway support **auto-deploy on git push:**

1. Push to your GitHub repo:
   ```bash
   git push origin main
   ```

2. Vercel and Railway automatically detect changes and redeploy

**Branch previews:**
- Vercel creates preview URLs for every branch/PR
- Great for testing before merging to main

---

## Scaling Considerations

### When You Need to Scale

**Current setup handles:**
- ~100-500 users/day easily
- Multiple concurrent analyses
- Good for MVP and showcasing

**When to upgrade:**
- 1000+ daily active users → Add load balancer
- 10+ concurrent analyses → Scale backend horizontally
- Global users → Add CDN (Vercel already includes this)

### Scaling Backend (Railway)

Railway makes it easy:
1. Dashboard → Settings → Resources
2. Increase memory/CPU
3. Or deploy multiple instances with load balancing

---

## Monitoring & Logs

### Railway Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# View logs
railway logs
```

### Vercel Logs
- Dashboard → Your Project → Logs
- See build logs and runtime logs

### Application Monitoring

Consider adding:
- **Sentry** for error tracking (free tier)
- **LogRocket** for session replay
- **Google Analytics** for usage tracking

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files to git (already in `.gitignore`)
- ✅ Use platform environment variables (Railway/Vercel)
- ✅ Rotate API keys periodically

### 2. Firebase Security Rules
```javascript
// Firestore rules - make sure users can only access their own data
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/history/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. CORS
- Update `app.py` CORS to allow only your frontend domain:
```python
CORS(app, resources={
    r"/*": {
        "origins": ["https://your-app.vercel.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        ...
    }
})
```

### 4. Rate Limiting
Add rate limiting to prevent abuse:
```bash
pip install flask-limiter
```

```python
from flask_limiter import Limiter

limiter = Limiter(
    app,
    default_limits=["200 per day", "50 per hour"]
)
```

---

## Cost Breakdown

### Recommended Setup (Vercel + Railway)

| Service | Cost | What You Get |
|---------|------|--------------|
| Vercel (Frontend) | **Free** | 100GB bandwidth, unlimited deploys |
| Railway (Backend) | **$5/month** | 512MB RAM, always-on server |
| Firebase | **Free** | 50K reads/day, 20K writes/day |
| **Total** | **$5/month** | Production-ready for 100s of users |

### When You Grow

| Users/Day | Monthly Cost | What Changes |
|-----------|--------------|--------------|
| <500 | $5 | Current setup works great |
| 500-2000 | $20-30 | Upgrade Railway plan, maybe paid Firebase |
| 2000+ | $50-100+ | Multiple backend instances, CDN, monitoring |

---

## Troubleshooting

### SSE Not Working
- Check CORS headers include proper expose headers
- Ensure Railway/backend allows keep-alive connections
- Test SSE endpoint directly: `curl -N https://backend.railway.app/research/stock/...`

### Firebase Auth Failing
- Check authorized domains in Firebase Console
- Verify environment variables are set correctly
- Check browser console for specific Firebase errors

### Build Failing
- Check Node.js version (should be 18+)
- Ensure all dependencies in package.json
- Check build logs for specific errors

### Backend Crashes
- Check Railway logs for Python errors
- Verify all environment variables are set
- Check memory usage - upgrade plan if needed

---

## Summary

**For your use case (showcasing online, good UX, affordable):**

✅ **Deploy Frontend to Vercel**
- Free, fast CDN, auto-deploys, perfect for React

✅ **Deploy Backend to Railway**
- $5/month, handles SSE perfectly, easy setup

✅ **Use Firebase for Auth & Database**
- Free tier is generous, scales automatically

**Total time to deploy:** 1-2 hours
**Total cost:** $5/month
**Perfect for:** Portfolio project, MVP, 100-1000 users

This setup will make your project look professional and run smoothly for anyone you share it with!
