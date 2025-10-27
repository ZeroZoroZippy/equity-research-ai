# 🎉 START HERE - See Your UI in Action!

## Run These Two Commands to See It Working:

### Terminal 1 - Backend (Demo Mode)

```bash
python app_demo.py
```

Wait until you see:
```
🚀 Starting Equity Research AI API (DEMO MODE)
Server running at: http://localhost:5001
```

### Terminal 2 - Frontend

Open a **NEW terminal** window and run:

```bash
cd frontend
npm run dev
```

Wait until you see:
```
➜  Local:   http://localhost:3000/
```

### Open Your Browser

Go to: **http://localhost:3000**

You should see your beautiful Equity Research AI dashboard! 🎨

---

## Try It Out:

1. **Click** on "Single Stock Analysis"
2. **Type** a stock symbol like `AAPL`, `MSFT`, or `TSLA`
3. **Select** exchange (US, NSE, or BSE)
4. **Click** "Start Analysis"
5. **Watch** the progress console with live agent updates
6. **View** the generated research report

The demo completes in ~3 seconds (vs 3-5 minutes for real AI agents).

---

## What You're Seeing:

✅ **Modern UI** - Bloomberg Terminal aesthetic
✅ **Live Progress** - Animated progress bar and agent status
✅ **Beautiful Reports** - Markdown-rendered with navigation
✅ **Smooth Animations** - Framer Motion powered transitions
✅ **Professional Design** - Dark theme with amber accents

---

## What's Next?

### For Portfolio/Posting Online:
- ✅ Take screenshots of different pages
- ✅ Record a demo video showing the flow
- ✅ Share on LinkedIn/Twitter/GitHub
- ✅ Add to your portfolio website

### For Production:
- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for full AI integration
- Install Anthropic agents library
- Configure API keys
- Switch from `app_demo.py` to `app.py`

---

## Files to Check Out:

- **README.md** - Project overview
- **QUICKSTART.md** - Quick start instructions
- **SETUP_GUIDE.md** - Detailed setup guide
- **UI_EXPLANATION.md** - How the UI works (for posting online)

---

## Troubleshooting:

### "Address already in use" error?
Port 5001 is in use. Either:
1. Kill the process using port 5001
2. Or change the port in `app_demo.py` to 5002 (and update `frontend/vite.config.js` too)

### Frontend won't start?
Make sure you ran `npm install` in the frontend directory first:
```bash
cd frontend
npm install
npm run dev
```

### Can't see the UI?
Check both terminals are still running and visit `http://localhost:3000` (not 5001)

---

## 🚀 You're All Set!

You now have a production-ready equity research web application with:
- Modern React frontend
- Professional design system
- Working demo backend
- Complete documentation

Perfect for your portfolio and ready to share online! 🎉

---

**Questions?** Check the other .md files in this directory for detailed guides.

**Enjoy!** 🤖📊
