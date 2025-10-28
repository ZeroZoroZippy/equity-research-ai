# Deployment Steps - Option A (Vercel + Render)

## Overview
- **Frontend:** Vercel (Free)
- **Backend:** Render (Free)
- **Total Cost:** $0/month

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Firebase Credentials

1. Open `firebase-service-account.json`
2. Copy the ENTIRE JSON content (you'll paste this in Render)

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 3: Deploy on Render

1. Go to https://render.com
2. Sign up (FREE - use GitHub login, no credit card needed)
3. Click "New +" → "Web Service"
4. Click "Connect account" → Authorize Render to access GitHub
5. Select your `equity-research-ai` repository
6. Configure the service:
   - **Name:** `equity-research-backend` (or whatever you prefer)
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn -w 1 -k gevent --timeout 300 --bind 0.0.0.0:$PORT app:app`
   - **Instance Type:** **Free**

7. Click "Advanced" → Add Environment Variables:

   ```
   OPENAI_API_KEY=sk-proj-xxxxx
   BRAVE_API_KEY=BSAxxxxx
   FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
   FLASK_ENV=production
   ```

   **IMPORTANT:** For `FIREBASE_CREDENTIALS_JSON`, paste the ENTIRE contents of your `firebase-service-account.json` file as a single line JSON string.

8. Click "Create Web Service"

### Step 4: Wait for Deploy

Render will:
- Install dependencies (2-3 minutes)
- Start your Flask app
- Give you a URL like: `https://equity-research-backend.onrender.com`

### Step 5: Test Backend

```bash
# Test health endpoint
curl https://YOUR-BACKEND-URL.onrender.com/health

# Should return: {"status":"healthy"}
```

**⚠️ IMPORTANT:** Copy your backend URL - you'll need it for the frontend!

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend API URL

You need to tell the frontend where your backend is.

**Option 1: Update in code (quick way)**

Find all API calls in your frontend and add the backend URL:

```javascript
// Example in ResearchAPI or wherever you make API calls
const API_URL = 'https://YOUR-BACKEND-URL.onrender.com';

fetch(`${API_URL}/research/stock`, options)
```

**Option 2: Use environment variable (better way)**

The frontend is already set up to use `VITE_API_URL` - you'll add this in Vercel.

### Step 2: Deploy on Vercel

1. Go to https://vercel.com
2. Sign up (FREE - use GitHub login)
3. Click "Add New..." → "Project"
4. Click "Import Git Repository"
5. Select your `equity-research-ai` repository
6. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

7. Add Environment Variables (click "Environment Variables"):

   ```
   VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
   VITE_FIREBASE_API_KEY=AIzaxxxxxxxxxx
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_APP_ID=1:xxxxx:web:xxxxx
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

   **Replace with your actual Firebase config values from `frontend/.env`**

8. Click "Deploy"

### Step 3: Get Your Frontend URL

Vercel will give you: `https://your-app.vercel.app`

---

## Part 3: Configure CORS

Update your backend to allow requests from your Vercel domain.

### Update app.py CORS settings:

```python
# In app.py, update the CORS section:
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",  # Local development
            "https://your-app.vercel.app",  # Your Vercel domain
            "https://*.vercel.app"  # All Vercel preview deployments
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False
    }
})
```

**Push this change:**
```bash
git add app.py
git commit -m "Update CORS for Vercel domain"
git push origin main
```

Render will auto-redeploy with the new CORS settings.

---

## Part 4: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain:
   - `your-app.vercel.app`
   - You can also add `*.vercel.app` for preview deployments

---

## Part 5: Test Everything

### Test Backend
```bash
curl https://YOUR-BACKEND-URL.onrender.com/health
```

### Test Frontend
1. Visit `https://your-app.vercel.app`
2. Click "Sign in with Google"
3. Log in
4. Try running a stock analysis

### Test Real-Time Updates
- Start a stock research
- Watch for live status updates (SSE should work)
- Verify report displays after completion

---

## Troubleshooting

### Backend Issues

**"Backend not responding" / Times out on first request:**
- ✅ This is normal! Free tier sleeps after 15 min
- ✅ First request takes ~30 seconds to wake up
- ✅ After wake-up, instant responses

**"500 Internal Server Error":**
- Check Render logs: Dashboard → Your service → Logs
- Common issues:
  - Missing environment variables
  - Invalid Firebase credentials
  - API keys not set

**"CORS error":**
- Make sure you updated CORS in `app.py` with your Vercel domain
- Push changes and wait for Render to redeploy

### Frontend Issues

**"Cannot connect to backend":**
- Check `VITE_API_URL` is set in Vercel
- Verify backend URL is correct (with https://)
- Check browser console for exact error

**"Firebase auth not working":**
- Verify Vercel domain is in Firebase authorized domains
- Check all Firebase env variables are set in Vercel
- Look at browser console for Firebase errors

**"Build failed":**
- Check Vercel build logs
- Ensure all dependencies in `package.json`
- Try building locally: `cd frontend && npm run build`

---

## Environment Variables Reference

### Backend (Render)
```
OPENAI_API_KEY=sk-proj-xxxxx
BRAVE_API_KEY=BSAxxxxx
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
FLASK_ENV=production
PORT=10000  # Auto-set by Render
```

### Frontend (Vercel)
```
VITE_API_URL=https://equity-research-backend.onrender.com
VITE_FIREBASE_API_KEY=AIzaxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:xxxxx:web:xxxxx
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Auto-Deploy Setup (Already Configured!)

Both platforms watch your GitHub repository:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Automatic deploys:
# - Render rebuilds backend (2-3 min)
# - Vercel rebuilds frontend (1-2 min)
```

**Branch Previews (Vercel only):**
- Create a new branch, push it
- Vercel automatically creates a preview URL
- Perfect for testing before merging to main

---

## Monitoring

### Render Dashboard
- Logs: Real-time Python logs
- Metrics: CPU, Memory usage
- Events: Deploy history

### Vercel Dashboard
- Analytics: Page views, performance
- Logs: Build and runtime logs
- Deployments: History and status

---

## Free Tier Limits

### Render Free Tier
- ✅ 750 hours/month (enough for moderate usage)
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ ~30s cold start
- ✅ 512MB RAM
- ✅ Unlimited requests (when awake)

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Global CDN
- ✅ SSL certificate
- ✅ Preview deployments

### Firebase Free Tier
- ✅ 50K reads/day
- ✅ 20K writes/day
- ✅ 1GB storage
- ✅ 10GB data transfer/month

**Handles ~100-500 users/day easily!**

---

## Upgrading (If Needed)

### When Free Tier is Not Enough

**Render Starter ($7/month):**
- Always-on (no sleep)
- No cold starts
- More memory and CPU

**Vercel Pro ($20/month):**
- Higher bandwidth
- Better analytics
- Team features

**Firebase Blaze (Pay as you go):**
- Only pay for what you use beyond free tier
- Usually $5-10/month for moderate usage

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Update CORS settings
4. ✅ Configure Firebase authorized domains
5. ✅ Test everything
6. 🎉 Share your live app!

**Your app is now live at:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://equity-research-backend.onrender.com`

---

## Questions?

**Cold starts too slow?**
- Upgrade to Render Starter ($7/month) for always-on backend

**Need custom domain?**
- Both Vercel and Render support custom domains (free)

**Want to see logs?**
- Render: Dashboard → Logs
- Vercel: Dashboard → Deployments → Function Logs

**Backend keeps sleeping?**
- Use a free cron service (cron-job.org) to ping every 10 minutes
- Or upgrade to paid tier

Good luck with your deployment! 🚀
