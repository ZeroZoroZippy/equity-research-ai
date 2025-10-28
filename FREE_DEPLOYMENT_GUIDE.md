# FREE Deployment Guide - Zero Cost

## 🎯 Best Free Option: Vercel + Render

**Total Cost: $0/month**
**No credit card required**

---

## Architecture

**Frontend (Vercel - Free):**
- React + Vite SPA
- Unlimited deployments
- Global CDN
- Custom domain support

**Backend (Render - Free):**
- Flask Python server
- 750 hours/month free
- Supports SSE (Server-Sent Events)
- Auto-sleeps after 15 min inactivity
- Wakes up on request (~30 sec cold start)

**Database (Firebase - Free):**
- Firestore: 50K reads/day, 20K writes/day
- Auth: Unlimited users
- Storage: 1GB

---

## Step-by-Step Deployment

### Part 1: Deploy Backend to Render (FREE)

#### 1.1 Prepare Your Backend

**Create `render.yaml` in root directory:**
```yaml
services:
  - type: web
    name: equity-research-backend
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: python app.py
    envVars:
      - key: PORT
        value: 10000
```

**Update `app.py` to use Render's PORT:**
Add at the bottom of `app.py`:
```python
if __name__ == '__main__':
    # Render uses PORT env variable
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
```

**Add `gunicorn` to `requirements.txt`:**
```
python-dotenv
openai-agents
mcp
fastmcp
pydantic
flask
flask-cors
markdown
anthropic
firebase-admin
gunicorn
```

#### 1.2 Deploy to Render

1. Go to https://render.com and sign up (FREE - use GitHub, no credit card)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** equity-research-backend
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn -w 1 -k gevent --timeout 300 app:app`
   - **Instance Type:** FREE
5. Click "Create Web Service"

#### 1.3 Set Environment Variables

In Render Dashboard → Environment tab, add:
```
OPENAI_API_KEY=your_key_here
BRAVE_API_KEY=your_key_here
```

**For Firebase credentials:**
Copy the JSON content from `firebase-service-account.json` and add as:
```
FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
```

Then update `app.py` to read from this env var:
```python
def initialize_firebase():
    global firebase_app, firestore_client

    if firebase_admin is None:
        logger.error("firebase-admin is not installed.")
        return

    if firebase_app:
        return

    try:
        if firebase_admin._apps:
            firebase_app = firebase_admin.get_app()
        else:
            # Check for JSON env var first (for Render)
            cred_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
            if cred_json:
                import json
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
                logger.info("Initialising Firebase using env JSON")
            else:
                cred_path = os.getenv('FIREBASE_CREDENTIALS')
                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    logger.info("Initialising Firebase using service account")
                else:
                    cred = credentials.ApplicationDefault()
                    logger.info("Initialising Firebase using default credentials")

            firebase_app = firebase_admin.initialize_app(cred)

        firestore_client = firestore.client()
        logger.info("Firebase initialised successfully.")
    except Exception as exc:
        firebase_app = None
        firestore_client = None
        logger.error("Failed to initialise Firebase: %s", exc)
```

#### 1.4 Get Your Backend URL

Render gives you: `https://equity-research-backend.onrender.com`

**Test it:**
```bash
curl https://equity-research-backend.onrender.com/health
```

**IMPORTANT:** Free tier sleeps after 15 min inactivity. First request takes ~30 seconds to wake up.

---

### Part 2: Deploy Frontend to Vercel (FREE)

#### 2.1 Update Frontend Configuration

**Update API calls to use environment variable:**

Create `frontend/src/config.js`:
```javascript
export const API_URL = import.meta.env.VITE_API_URL || '';
```

**Update API calls in your components:**
```javascript
import { API_URL } from './config';

// In your API calls:
fetch(`${API_URL}/research/stock`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
})
```

**Create `frontend/vercel.json`:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

#### 2.2 Deploy to Vercel

1. Go to https://vercel.com and sign up (FREE - use GitHub)
2. Click "Add New" → "Project"
3. Import your repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** frontend
   - **Build Command:** `npm run build`
   - **Output Directory:** dist

5. **Environment Variables:**
   ```
   VITE_API_URL=https://equity-research-backend.onrender.com
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

6. Click "Deploy"

**Your app is live at:** `https://your-app.vercel.app`

---

### Part 3: Configure CORS

Update `app.py` CORS to allow your Vercel domain:

```python
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",  # Local development
            "https://your-app.vercel.app"  # Production
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False
    }
})
```

---

### Part 4: Configure Firebase

1. Go to Firebase Console → Authentication → Settings
2. Add **Authorized domains:**
   - `your-app.vercel.app`
   - Any other Vercel preview URLs if needed

---

## Alternative Free Options

### Option 2: Netlify + Render

**Same as above but use Netlify for frontend instead of Vercel**

Both are free and work the same way. Choose whichever you prefer.

### Option 3: All on Render

Deploy both frontend and backend on Render (both free):
- Backend as Web Service
- Frontend as Static Site

**Pros:** Everything in one place
**Cons:** Render's free static hosting is more limited than Vercel

### Option 4: GitHub Pages + Render

**Frontend:** GitHub Pages (free, unlimited)
**Backend:** Render (free)

**Setup:**
```bash
# In frontend directory
npm run build
# Deploy dist/ to gh-pages branch
```

---

## Free Tier Limitations & Workarounds

### Render Free Tier

**Limitations:**
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ ~30 second cold start when waking up
- ⚠️ 750 hours/month (enough for moderate usage)

**Workarounds:**
1. **Add a keep-alive service** (optional):
   - Use cron-job.org (free) to ping your backend every 10 minutes
   - Keeps it awake during business hours
   - Still saves hours when you don't need it

2. **Show loading state on frontend:**
   - Detect cold start and show: "Waking up backend server (30s)..."
   - Better UX than user thinking it's broken

3. **Accept the cold start:**
   - For a portfolio/demo project, 30s first load is fine
   - Subsequent requests are instant

### Vercel Free Tier

**Limitations:**
- 100GB bandwidth/month (very generous)
- Unlimited deployments
- No limitations that will affect you

### Firebase Free Tier

**Spark Plan includes:**
- 50K document reads/day
- 20K document writes/day
- 1GB storage
- 10GB data transfer/month

**Plenty for:**
- 100-500 users/day
- Moderate research history

---

## Handling Cold Starts (Render Backend)

### Update Frontend to Handle Wake-Up

**Add to your API utility:**

```javascript
// frontend/src/lib/api.js

const makeRequest = async (url, options, retries = 2) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeout);
    return response;
  } catch (error) {
    if (retries > 0 && error.name === 'AbortError') {
      // Likely cold start, retry
      console.log('Retrying request (cold start)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeRequest(url, options, retries - 1);
    }
    throw error;
  }
};
```

**Add loading message:**
```javascript
// Show on first request
<div className="text-center">
  <p>Waking up the research engine...</p>
  <p className="text-sm text-gray-500">First load may take 30 seconds</p>
</div>
```

---

## Keep Backend Awake (Optional)

### Free Ping Service

**Use cron-job.org (free):**

1. Sign up at https://cron-job.org
2. Create new cron job:
   - URL: `https://equity-research-backend.onrender.com/health`
   - Interval: Every 10 minutes
   - Hours: 9 AM - 11 PM (your active hours)

This keeps your backend awake during the day, saves hours at night.

**Or use this in your backend:**

```python
# Add keep-alive endpoint
@app.route('/keep-alive', methods=['GET'])
def keep_alive():
    return jsonify({"status": "awake", "time": datetime.now().isoformat()})
```

---

## Environment Variables Summary

### Backend (Render)
```
OPENAI_API_KEY=sk-...
BRAVE_API_KEY=BSA...
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
PORT=10000
```

### Frontend (Vercel)
```
VITE_API_URL=https://equity-research-backend.onrender.com
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:...
VITE_FIREBASE_MEASUREMENT_ID=G-...
```

---

## Deployment Workflow

### Auto-Deploy on Git Push

Both Vercel and Render watch your GitHub repo:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Both services auto-deploy:
# - Vercel rebuilds frontend
# - Render rebuilds backend
```

**Branch Previews:**
- Vercel creates preview URLs for every branch
- Great for testing before merging

---

## Monitoring (Free Tools)

### Built-in Monitoring
- **Render:** Dashboard shows logs, metrics, deploy history
- **Vercel:** Analytics, build logs, runtime logs

### Free External Tools
- **UptimeRobot** - Monitor uptime (free for 50 monitors)
- **Sentry** - Error tracking (free tier: 5K errors/month)
- **Google Analytics** - Usage tracking (completely free)

---

## Troubleshooting

### "Backend not responding"
- Check if backend is sleeping (Render free tier)
- Wait 30 seconds for cold start
- Check Render logs for errors

### "CORS errors"
- Verify Vercel domain in CORS config
- Check `app.py` origins list
- Ensure no trailing slashes in URLs

### "Firebase auth not working"
- Add Vercel domain to Firebase authorized domains
- Check environment variables are set
- Verify API keys are correct

### "Build failing on Vercel"
- Check build logs in Vercel dashboard
- Ensure `package.json` has all dependencies
- Verify Node.js version compatibility

### "Backend crashes on Render"
- Check Render logs for Python errors
- Verify environment variables are set
- Check memory usage (free tier has limits)

---

## Limitations vs Paid

### What You Give Up (vs $5/month Railway)

| Feature | Free (Render) | Paid (Railway $5) |
|---------|---------------|-------------------|
| Always-on | ❌ Sleeps after 15min | ✅ Always running |
| Cold start | ⚠️ ~30 seconds | ✅ Instant |
| Monthly hours | 750 hours | Unlimited |
| Memory | 512MB | 512MB+ |

### What You Still Get

✅ Professional URLs with SSL
✅ Auto-deploys on git push
✅ Global CDN for frontend
✅ Enough for 100-500 users/day
✅ Perfect for portfolio/demo
✅ Can upgrade anytime

---

## When to Upgrade

**Stick with free if:**
- Portfolio/demo project
- <500 users/day
- Cold starts are acceptable
- Budget is $0

**Upgrade to paid when:**
- >1000 daily active users
- Need instant responses (no cold starts)
- Professional product
- Budget allows $5-10/month

---

## Summary

### Completely Free Stack:
- ✅ **Vercel (Frontend)** - Free forever
- ✅ **Render (Backend)** - Free with cold starts
- ✅ **Firebase (Auth + DB)** - Free tier is generous

### Setup Time:
- **1-2 hours** to deploy everything
- **5 minutes** per deploy after initial setup

### What It Handles:
- 100-500 users per day
- Multiple concurrent analyses
- Full features (auth, history, real-time updates)
- Professional appearance

### Trade-offs:
- ⚠️ First load takes 30 seconds (cold start)
- ⚠️ Backend sleeps after inactivity
- ✅ Subsequent loads are instant
- ✅ Can upgrade anytime if needed

**Perfect for showcasing your project online without spending a dime!**
