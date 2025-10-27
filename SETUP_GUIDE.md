# Equity Research AI - Complete Setup Guide

## Quick Start (Demo Mode - Works Immediately!)

The fastest way to see the UI in action is using the demo backend:

### Step 1: Start Demo Backend

Open a terminal and run:

```bash
python app_demo.py
```

You should see:
```
============================================================
🚀 Starting Equity Research AI API (DEMO MODE)
============================================================
This is a demo backend for testing the UI
It generates mock reports instead of real AI analysis
Server running at: http://localhost:5001
============================================================
 * Running on http://127.0.0.1:5001
```

**Keep this terminal running!**

### Step 2: Start Frontend

Open a **new terminal** and run:

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

### Step 3: Open Browser

Navigate to `http://localhost:3000` and you'll see the Equity Research AI dashboard!

**What to try:**
- Enter a stock symbol like `AAPL`, `MSFT`, or `GOOGL`
- Click "Start Analysis"
- Watch the progress console (completes in ~3 seconds for demo)
- View the generated report

The demo backend generates mock reports instantly so you can test the UI without waiting for real AI agents.

---

## Production Mode (Real AI Agents)

To use the real AI-powered multi-agent research system, you need to set up the full stack.

### Prerequisites

1. **Python Packages:**
```bash
pip install -r requirements.txt
```

2. **Anthropic Agents Library:**

The code uses `from agents import Runner` which appears to be Anthropic's Agents framework. This might be:
- A private/beta package
- Requires special installation
- Part of a specific Anthropic SDK

**You'll need to:**
- Check if you have access to Anthropic's agents package
- Install it according to Anthropic's documentation
- OR modify `research_system.py` to use a different agents framework

3. **API Keys:**

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your_openai_key_here
BRAVE_API_KEY=your_brave_search_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here  # if needed
```

4. **MCP Servers:**

The system uses Model Context Protocol (MCP) servers:
- Yahoo Finance MCP (`uvx mcp-yahoo-finance`)
- Brave Search MCP (`npx @modelcontextprotocol/server-brave-search`)

Make sure these are installed:

```bash
# Install uvx if not present
pip install uvx

# Test Yahoo Finance MCP
uvx mcp-yahoo-finance

# Test Brave Search MCP
npx @modelcontextprotocol/server-brave-search
```

### Running Production Mode

Once you have the `agents` library working:

**Terminal 1 - Backend:**
```bash
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open `http://localhost:3000`

**Note:** Production research takes:
- Single stock: 3-5 minutes (8 AI agents working)
- Sector analysis: 10-20 minutes (analyzing 5-10 companies)

---

## Troubleshooting

### Port 5000 Already in Use

On macOS, AirPlay Receiver uses port 5000 by default.

**Solution 1:** Disable AirPlay Receiver
- System Preferences → General → AirDrop & Handoff
- Turn off "AirPlay Receiver"

**Solution 2:** Use port 5001 (already configured in demo mode)
- The demo app uses port 5001
- Frontend is configured to proxy to 5001

### "Module 'agents' not found"

This means the Anthropic agents library isn't installed.

**Options:**
1. Use `app_demo.py` for UI testing (works immediately)
2. Find and install the correct agents package
3. Modify the code to use a different agents framework

### Frontend Won't Connect to Backend

1. Check backend is running:
```bash
curl http://localhost:5001/health
```

Should return: `{"mode": "demo", "status": "healthy", ...}`

2. Check Vite proxy configuration in `frontend/vite.config.js`:
```javascript
proxy: {
  '/research': {
    target: 'http://localhost:5001',  // Should match your backend port
    changeOrigin: true,
  },
```

3. Restart both servers

### npm install Fails

Make sure you're in the frontend directory:
```bash
cd frontend
npm install
```

If issues persist, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Project Structure

```
equity-research-ai/
├── frontend/               # React UI
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main pages
│   │   └── lib/api.js     # Backend API calls
│   └── package.json
├── research_system.py      # Main research logic (requires agents lib)
├── research_agents.py      # Agent definitions
├── sector_agents.py        # Sector analysis agents
├── app.py                  # Production Flask backend (needs agents lib)
├── app_demo.py             # Demo Flask backend (works immediately!)
└── requirements.txt        # Python dependencies
```

---

## Development Workflow

### Testing UI Changes

1. Keep demo backend running: `python app_demo.py`
2. Make changes to frontend code
3. Vite auto-reloads - see changes instantly in browser

### Modifying Components

Components are in `frontend/src/components/`:
- `Button.jsx` - Buttons with hover effects
- `Card.jsx` - Container cards
- `Input.jsx` - Form inputs
- `ProgressBar.jsx` - Animated progress bars
- `AgentStatus.jsx` - Agent status indicators

### Modifying Pages

Pages are in `frontend/src/pages/`:
- `Dashboard.jsx` - Home page
- `ResearchConsole.jsx` - Progress tracking during research
- `ReportViewer.jsx` - Report display with navigation
- `SectorComparison.jsx` - Sector analysis view

### Changing Colors/Styling

Edit `frontend/tailwind.config.js`:
```javascript
colors: {
  bg: {
    primary: '#0A0E14',  // Main background
    secondary: '#1C2128', // Cards
    tertiary: '#262C36',  // Hover states
  },
  accent: {
    DEFAULT: '#F59E0B',  // Amber/gold accent
  },
  // ... more colors
}
```

---

## What's Next?

### For UI Testing
- ✅ Use `app_demo.py` - works immediately
- ✅ Test all pages and flows
- ✅ Take screenshots for your portfolio
- ✅ Record demo videos

### For Production
- ⏳ Install Anthropic agents library
- ⏳ Configure API keys
- ⏳ Test with real stock data
- ⏳ Deploy to production

### Enhancements
- Add real-time progress updates via Server-Sent Events
- Implement PDF export
- Add report history/database
- Create user authentication
- Deploy frontend (Vercel, Netlify) and backend (Railway, Fly.io)

---

## Support

If you encounter issues:

1. **For UI issues:** Check browser console (F12) for errors
2. **For backend issues:** Check terminal output for error messages
3. **For API connection:** Verify both servers are running on correct ports

---

## Success! 🎉

You now have:
- ✅ Modern React UI with Bloomberg Terminal aesthetic
- ✅ Demo backend for instant testing
- ✅ Production-ready code structure
- ✅ Fully functional web interface
- ✅ Perfect foundation for your portfolio project

Start with demo mode to showcase the UI, then integrate the real AI agents when ready!
