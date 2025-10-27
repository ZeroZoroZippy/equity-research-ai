# 🤖 Equity Research AI

A modern web application that performs comprehensive equity research using 8 AI agents working in parallel. Features a Bloomberg Terminal-inspired interface built with React and powered by a Python Flask backend.

![Status](https://img.shields.io/badge/status-active-success)
![Frontend](https://img.shields.io/badge/frontend-React_18-blue)
![Backend](https://img.shields.io/badge/backend-Flask-green)

## ✨ Features

### 🎯 Two Research Modes

1. **Single Stock Analysis** (3-5 minutes)
   - Deep dive into one company
   - 8 AI agents analyze: financials, technicals, news, competitors, strategy
   - Comprehensive report with buy/hold/sell recommendation

2. **Sector Comparison** (10-20 minutes)
   - Analyze 5-10 companies in a sector
   - Compare valuation, growth, and quality metrics
   - Portfolio allocation recommendations
   - Top pick identification

### 🎨 Modern UI

- **Bloomberg Terminal Aesthetic**: Dark theme with amber/gold accents
- **Real-Time Progress**: Watch AI agents work with live status updates
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion powered transitions
- **Interactive Reports**: Markdown-rendered with sidebar navigation

### 🤖 AI-Powered Analysis

- **Financial Analyst**: Analyzes company financials and valuation
- **Technical Analyst**: Charts, trends, and momentum indicators
- **News Analyst**: Recent developments and sentiment
- **Comparative Analyst**: Peer comparison and competitive positioning
- **Report Generator**: Synthesizes findings into comprehensive reports
- **Strategic Analyst**: Big-picture insights and recommendations
- **Sector Analyst**: Identifies top companies in sectors
- **Portfolio Strategist**: Allocation and ranking recommendations

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd equity-research-ai

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Running the App

**Option 1: Demo Mode (Recommended for testing UI)**

Terminal 1:
```bash
python app_demo.py
```

Terminal 2:
```bash
cd frontend
npm run dev
```

Then open `http://localhost:3000`

**Option 2: Production Mode (Real AI agents)**

Requires Anthropic agents library installed.

Terminal 1:
```bash
python app.py
```

Terminal 2:
```bash
cd frontend
npm run dev
```

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

## 📁 Project Structure

```
equity-research-ai/
├── frontend/                # React UI
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   └── lib/            # API integration
│   ├── tailwind.config.js  # Design system
│   └── package.json
├── research_system.py       # Core research logic
├── research_agents.py       # Agent definitions
├── sector_agents.py         # Sector analysis
├── app.py                   # Production Flask backend
├── app_demo.py              # Demo Flask backend
├── requirements.txt         # Python dependencies
├── QUICKSTART.md            # Quick start guide
├── SETUP_GUIDE.md           # Detailed setup instructions
└── UI_EXPLANATION.md        # UI implementation details
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **React Markdown** - Report rendering
- **Recharts** - Data visualization
- **Lucide Icons** - Icon library

### Backend
- **Flask** - Web framework
- **Python Agents SDK** - AI agent orchestration
- **MCP Servers** - Data sources (Yahoo Finance, Brave Search)
- **OpenAI / Anthropic** - LLM providers

## 🎨 Design System

### Color Palette
```
Background Primary:   #0A0E14
Background Secondary: #1C2128
Background Tertiary:  #262C36
Accent (Amber):       #F59E0B
Success (Green):      #10B981
Danger (Red):         #EF4444
Warning (Orange):     #F97316
```

### Typography
- **Primary**: Inter (sans-serif)
- **Monospace**: JetBrains Mono (for stock symbols, numbers)

## 📸 Screenshots

> Take screenshots of your app and add them here!

## 🚧 Development

### Running in Development

```bash
# Backend (auto-reloads on changes)
python app_demo.py

# Frontend (hot module replacement)
cd frontend
npm run dev
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Output will be in frontend/dist/
```

## 🐛 Troubleshooting

### Port 5000 Already in Use
On macOS, disable AirPlay Receiver in System Preferences, or the demo app uses port 5001 by default.

### "Module 'agents' not found"
Use `app_demo.py` for UI testing. Production mode requires the Anthropic agents library.

### Frontend Won't Connect
Check that both servers are running and Vite proxy is configured for the correct backend port.

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for more troubleshooting.

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get up and running in 2 minutes
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Comprehensive setup instructions
- **[UI_EXPLANATION.md](UI_EXPLANATION.md)** - How the UI works and what was built
- **[frontend/README.md](frontend/README.md)** - Frontend-specific documentation

## 🎯 Roadmap

- [ ] Real-time progress updates via Server-Sent Events
- [ ] PDF export functionality
- [ ] User authentication and saved reports
- [ ] Report history and search
- [ ] Mobile app (React Native)
- [ ] Export to Excel/CSV
- [ ] Custom alert notifications
- [ ] Portfolio tracking

## 🤝 Contributing

Contributions are welcome! This is a portfolio/demo project.

## 📝 License

MIT License - feel free to use for your own projects!

## 🙏 Acknowledgments

- Bloomberg Terminal for design inspiration
- Anthropic for AI agent framework
- MCP Protocol for data integration
- Tailwind CSS for rapid styling

## 📧 Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)
- Twitter: [@yourhandle](https://twitter.com/yourhandle)

---

**Built with ❤️ using React, Flask, and AI Agents**

⭐ Star this repo if you found it helpful!
