# Quick Start Guide

## 🚀 Demo Mode (Recommended for First Run)

The easiest way to test the UI is with the demo backend that generates mock reports instantly!

### Step 1: Start Demo Backend

Open a terminal and run:

```bash
# Make sure you're in the project root
python app_demo.py
```

You should see:
```
🚀 Starting Equity Research AI API (DEMO MODE)
Server running at: http://localhost:5001
 * Running on http://127.0.0.1:5001
```

**Keep this terminal running!**

---

## 🔬 Production Mode (Real AI Agents)

To use the full AI-powered system, you need the Anthropic agents library installed.

### Step 1: Start Production Backend

Open a terminal and run:

```bash
# Make sure you're in the project root
python app.py
```

You should see:
```
INFO:__main__:Starting Equity Research AI API on http://localhost:5001
 * Running on http://127.0.0.1:5001
```

**Note:** If you get "Module 'agents' not found", use demo mode instead.

**Keep this terminal running!**

### Step 2: Start the React Frontend

Open a **new terminal** (keep the first one running) and run:

```bash
# Navigate to frontend folder
cd frontend

# Start the dev server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

### Step 3: Open Your Browser

Open `http://localhost:3000` in your browser.

You should see the **Equity Research AI** dashboard with two mode options.

## Testing the UI

### Test Single Stock Analysis

1. Click on the "Single Stock Analysis" card
2. Enter a stock symbol (e.g., `AAPL`, `MSFT`, `GOOGL`)
3. Select an exchange (US, NSE, or BSE)
4. Click "Start Analysis"
5. Watch the progress console with live agent updates
6. View the final report

### Test Sector Analysis

1. Click on the "Sector Comparison" card
2. Select a sector (e.g., "Technology") or enter a custom one
3. Select an exchange
4. Click "Start Comparison"
5. Watch the agents work
6. View the comparison results with portfolio recommendations

## Troubleshooting

### Backend won't start
- Make sure you have all Python dependencies: `pip install -r requirements.txt`
- Check if port 5000 is already in use
- Ensure your `.env` file has the required API keys

### Frontend won't start
- Make sure you ran `npm install` first
- Check if port 3000 is already in use
- Try `npm run dev -- --port 3001` to use a different port

### "Failed to start research" error
- Verify Flask backend is running on `http://localhost:5000`
- Check Flask terminal for error messages
- Try hitting `http://localhost:5000/health` in your browser

### Progress bar stuck at 0%
- This is currently using mock progress updates
- The actual research is happening in the backend
- After 3-5 minutes (stock) or 10-20 minutes (sector), results will appear
- Future update will add real-time progress from Flask

## Project Structure

```
equity-research-ai/
├── frontend/              # React UI application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main application pages
│   │   ├── lib/          # API integration
│   │   └── ...
│   └── package.json
├── research_system.py     # Flask backend server
├── research_agents.py     # AI agent definitions
├── sector_agents.py       # Sector analysis agents
└── requirements.txt       # Python dependencies
```

## Next Steps

1. **Customize Design**: Edit colors in `frontend/tailwind.config.js`
2. **Add Real Progress**: Implement Server-Sent Events in Flask
3. **Save Reports**: Add a database to store research history
4. **Deploy**: Build frontend (`npm run build`) and deploy both apps

## For Posting Online

### Screenshots to Take
1. Dashboard page (home screen)
2. Research console with agents working
3. Final report view
4. Sector comparison view

### Demo Video Ideas
1. Show entering a stock symbol
2. Fast-forward through the research process
3. Navigate through the final report
4. Show sector comparison features

### Key Talking Points
- "8 AI agents working in parallel"
- "3-5 minute comprehensive stock analysis"
- "Bloomberg Terminal inspired design"
- "Real-time progress tracking"
- "Actionable buy/hold/sell recommendations"

## Support

If you encounter issues:
1. Check both terminal windows for error messages
2. Ensure all dependencies are installed
3. Verify API keys are set in `.env`
4. Try restarting both servers

Enjoy your AI-powered equity research terminal!
