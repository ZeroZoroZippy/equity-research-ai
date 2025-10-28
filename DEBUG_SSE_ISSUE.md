# SSE Connection Debugging Guide

## Current Issue
Frontend is not receiving SSE messages from backend. Timer updates work but agent activity is not displayed.

## What to Check

### 1. Check Browser Console
Open browser DevTools (F12) and look for these logs:

**Should see:**
```
=== Creating progress stream ===
Type: stock
Session ID: stock_AAPL_1234567890
=== Calling connectProgressStream ===
=== SessionID being passed: stock_AAPL_1234567890
=== ResearchAPI.connectProgressStream exists? function
🔌 Connecting to SSE stream for session: stock_AAPL_1234567890
🔌 SSE URL: /research/progress/stock_AAPL_1234567890
🔌 Full URL: http://localhost:3000/research/progress/stock_AAPL_1234567890
SSE connection opened successfully
=== SSE UPDATE RECEIVED === {type: 'connected', message: 'SSE stream connected'}
```

**If you DON'T see these logs:**
- The function is not being called
- Console is filtering logs
- JavaScript error is preventing execution

### 2. Check Network Tab
In browser DevTools, go to Network tab:

**Look for:**
- Request to `/research/stock` (POST) - should return `{success: true, session_id: "..."}`
- Request to `/research/progress/stock_AAPL_...` (GET) - should be "EventStream" type
- The EventStream request should stay open (pending)

**If EventStream request shows error:**
- 404: Backend endpoint not found
- 502/503: Proxy not working
- CORS error: CORS configuration issue

### 3. Check Backend Logs
In the terminal running `python app.py`, look for:

```
INFO:__main__:Starting stock research for AAPL (US), session: stock_AAPL_1234567890
INFO:__main__:Starting SSE stream for session stock_AAPL_1234567890
INFO:__main__:Sending SSE update for stock_AAPL_1234567890: {'type': 'connected', ...}
```

**If you DON'T see "Starting SSE stream":**
- Frontend is not connecting to SSE endpoint
- Proxy is not forwarding requests

### 4. Verify Servers Are Running

**Backend (Flask):**
```bash
# Should be running on port 5001
curl http://localhost:5001/health
# Should return: {"status":"healthy","timestamp":"..."}
```

**Frontend (Vite):**
```bash
# Should be running on port 3000
# Open http://localhost:3000 in browser
```

### 5. Test SSE Directly

**Option A: Use test HTML page**
```bash
# Open in browser: http://localhost:3000/test-sse.html
# Click "Start Research" then "Connect SSE"
# Watch the messages appear
```

**Option B: Use curl**
```bash
# First start a research
curl -X POST http://localhost:5001/research/stock \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","exchange":"US"}'
# Note the session_id from response

# Then connect to SSE (replace SESSION_ID)
curl -N http://localhost:5001/research/progress/SESSION_ID
# Should see: data: {"type":"connected",...}
```

**Option C: Use Python test script**
```bash
python test_sse.py
```

## Common Issues & Solutions

### Issue 1: Proxy Not Working
**Symptom:** Network tab shows 404 for `/research/progress/...`

**Solution:** Make sure Vite dev server is running and proxy is configured:
```javascript
// frontend/vite.config.js
proxy: {
  '/research': {
    target: 'http://localhost:5001',
    changeOrigin: true,
  },
}
```

### Issue 2: Backend Not Sending Messages
**Symptom:** SSE connects but no messages received

**Solution:** Check backend logs for errors in `research_system.py`:
- ImportError when trying to import `progress_queues` from `app`
- Exception in `_log_status` method

### Issue 3: CORS Issues
**Symptom:** Browser console shows CORS error

**Solution:** Backend CORS is configured, but check if it's being applied:
```python
# app.py
CORS(app, resources={r"/*": {"origins": "*"}})
```

### Issue 4: EventSource Not Supported
**Symptom:** `EventSource is not defined`

**Solution:** Use modern browser (Chrome, Firefox, Safari, Edge)

## Quick Fix Checklist

- [ ] Backend running on port 5001
- [ ] Frontend running on port 3000
- [ ] Browser console shows "Creating progress stream"
- [ ] Browser console shows "Connecting to SSE stream"
- [ ] Network tab shows EventStream request
- [ ] Backend logs show "Starting SSE stream"
- [ ] Backend logs show "Sending SSE update"
- [ ] No CORS errors in console
- [ ] No 404 errors in Network tab

## If Still Not Working

1. **Restart both servers** (backend and frontend)
2. **Clear browser cache** and hard reload (Ctrl+Shift+R)
3. **Try incognito/private window** to rule out extensions
4. **Check firewall** isn't blocking localhost connections
5. **Try different browser** to rule out browser-specific issues
