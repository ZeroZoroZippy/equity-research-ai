# Equity Research AI - Frontend

Modern React UI for the multi-agent equity research system.

## Quick Start

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

The app will run at `http://localhost:3000`

**Important:** Make sure your Flask backend is running on `http://localhost:5000`

### Build for Production
```bash
npm run build
```

Output will be in `dist/` folder.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Select.jsx
│   ├── ProgressBar.jsx
│   └── AgentStatus.jsx
├── pages/           # Main application pages
│   ├── Dashboard.jsx
│   ├── ResearchConsole.jsx
│   ├── ReportViewer.jsx
│   └── SectorComparison.jsx
├── lib/            # Utilities and API
│   └── api.js
├── App.jsx         # Main app with routing
├── main.jsx        # App entry point
└── index.css       # Global styles
```

## Features

- **Single Stock Analysis** - Deep dive into one company (3-5 min)
- **Sector Comparison** - Compare 5-10 companies (10-20 min)
- **Real-Time Progress** - Watch AI agents work in parallel
- **Beautiful Reports** - Markdown-rendered with navigation
- **Dark Theme** - Bloomberg Terminal inspired design

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Recharts
- React Markdown

## Design System

### Colors
- Background: `#0A0E14` (dark navy)
- Cards: `#1C2128` (charcoal)
- Accent: `#F59E0B` (amber/gold)
- Success: `#10B981` (green)
- Danger: `#EF4444` (red)

### Typography
- Primary: Inter
- Monospace: JetBrains Mono

## API Integration

The frontend expects a Flask backend at `http://localhost:5000` with these endpoints:

- `POST /research/stock` - Start stock analysis
  ```json
  { "symbol": "AAPL", "exchange": "US" }
  ```

- `POST /research/sector` - Start sector analysis
  ```json
  { "sector": "Technology", "exchange": "US", "num_companies": 5 }
  ```

- `GET /health` - Health check

## Development

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Link from existing pages

### Adding a New Component
1. Create in `src/components/`
2. Import and use in pages
3. Follow existing patterns for props

### Styling
Use Tailwind utility classes. Custom colors are in `tailwind.config.js`.

## Notes

- Progress updates currently use mock data. Replace with real SSE/WebSocket.
- PDF export button is placeholder - needs implementation.
- Share functionality needs backend endpoint.
