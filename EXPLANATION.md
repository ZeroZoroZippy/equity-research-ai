# AI-Powered Equity Research System

## What This Project Does

This is an **automated stock research system** that uses AI agents to analyze stocks like a professional research team would. Instead of manually researching financial data, news, and competitors, this system does it all automatically in minutes.

**Input:** A stock ticker (like "AAPL" or "TSLA")
**Output:** A comprehensive research report with fundamental analysis, technical analysis, news sentiment, peer comparison, and strategic insights

---

## How It Works (Simple Explanation)

Think of it like hiring 5 different analysts who work together:

### 1. **Financial Analyst** 📊
- Looks at the company's money: revenue, profit, cash flow
- Checks if it's profitable and growing
- Calculates if the stock is expensive or cheap (P/E ratio, etc.)
- **What it answers:** "Is this company financially healthy?"

### 2. **Technical Analyst** 📈
- Studies the stock price movements and trends
- Identifies if price is going up, down, or sideways
- Finds important price levels to watch
- **What it answers:** "What is the price trend telling us?"

### 3. **News Analyst** 📰
- Searches the web for recent news (last 30 days)
- Finds partnerships, earnings reports, product launches, etc.
- Assesses market sentiment (bullish/bearish/neutral)
- **What it answers:** "What's happening with this company right now?"

### 4. **Comparative Analyst** ⚖️ (NEW!)
- Compares the stock against 3-5 competitor companies
- Creates comparison tables for valuation, growth, profitability
- Ranks the company among its peers
- **What it answers:** "Is this stock a better deal than its competitors?"

### 5. **Strategic Analyst** 🧠
- Reads everything the other analysts found
- Connects the dots and thinks about future implications
- Makes predictions and gives a conviction score
- **What it answers:** "What's my take on where this is headed?"

### 6. **Report Generator** ✍️
- Combines all the analyses into one clean report
- Organizes everything with clear sections (Executive Summary, Fundamental, Technical, News, **Peer Comparison**, Synthesis, Risk Assessment)
- Provides balanced bull/bear cases
- **What it does:** "Puts it all together in a readable format"

---

## Key Features That Make This Special

### ✅ **Shared Memory Across Agents**
All analysts share a "knowledge graph" - they remember what they've researched before and learn from each other. If one analyst finds something useful about Apple, the others can access that information too.

### ✅ **Real Market Data**
Uses Yahoo Finance for live stock prices, financial statements, and company data.

### ✅ **Web Search for News**
Uses Brave Search to find the latest news articles, announcements, and developments.

### ✅ **Runs in Parallel**
All analysts work at the same time (not one after another), so you get results fast.

### ✅ **No Follow-up Questions**
The AI agents are specifically instructed to give complete analyses without asking "Do you want more information?" at the end.

---

## Technical Architecture (For Tech Posts)

```
User Request (Stock Symbol)
         ↓
    System Connects to:
    - Yahoo Finance MCP (stock data)
    - Brave Search MCP (news)
    - Memory MCP (shared knowledge)
         ↓
    4 Analysts Run in Parallel:
    [Financial] [Technical] [News] [Comparative]
         ↓
    Report Generator Synthesizes
         ↓
    Strategic Analyst Adds Final Take
         ↓
    Complete Research Report
```

**Tech Stack:**
- **OpenAI Agents SDK** - Multi-agent orchestration
- **Model Context Protocol (MCP)** - Tool/data integration
- **GPT-5-nano** - Fast, cost-effective model
- **Python + Async** - For parallel execution
- **Knowledge Graph** - Persistent memory across sessions

---

## What Changed Recently (Latest Updates)

### Update #1: Rich Context & Shared Memory
**What changed:**
- Made agent prompts way more detailed (following professional template patterns)
- Added knowledge graph memory so agents remember past research
- Each agent now knows exactly which tools they have and how to use them

**Why:**
- Agents were giving shallow analysis with generic responses
- They weren't using all available tools effectively
- No memory between research sessions

**Result:**
- Much more comprehensive, data-driven analyses
- Agents actually search for news instead of making things up
- They remember companies they've analyzed before

### Update #2: Peer Comparison Feature (NEW!)
**What changed:**
- Added a 4th analyst (Comparative Analyst)
- This analyst compares your stock against 3-5 competitors
- Creates comparison tables for valuation, growth, and profitability

**Why:**
- Knowing a stock has a P/E of 25 doesn't help much alone
- You need to know: "Is 25 high or low compared to competitors?"
- Relative valuation is crucial for investment decisions

**Result:**
- Reports now show if a stock is cheap/expensive vs peers
- Helps identify if company is industry leader or laggard
- Makes investment thesis much stronger

**Example:**
```
Before: "Apple has P/E of 30"
After:  "Apple P/E of 30 vs competitors (MSFT: 35, GOOGL: 25, META: 22)
         → Apple is mid-range valued in Big Tech"
```

---

## How to Use

```python
# Simple usage
system = EquityResearchSystem()
report = await system.research_stock("AAPL", "US")
print(report)
```

**Supported Markets:**
- `"US"` - US stocks (AAPL, TSLA, NVDA, etc.)
- `"NSE"` - India NSE (adds .NS suffix)
- `"BSE"` - India BSE (adds .BO suffix)

---

## Project Goals

This project demonstrates:
1. **Multi-agent AI collaboration** - Different AI agents with specialized roles
2. **Real-world data integration** - Not just LLM knowledge, but live market data
3. **Practical automation** - Saves hours of manual research
4. **Clean architecture** - Simple, maintainable code structure

**End Goal:** Show how AI agents can work together like a real research team to produce institutional-quality analysis automatically.

---

## What Makes This Different from ChatGPT?

| Feature | ChatGPT | This System |
|---------|---------|-------------|
| **Data** | Training data only | Live market data + news |
| **Structure** | One model | 5 specialized agents |
| **Memory** | Per-conversation | Persistent knowledge graph |
| **Output** | Conversational | Structured research report |
| **Peer Analysis** | Manual request | Automatic comparison |
| **News** | Can't search web | Real-time news search |

---

## Future Improvements

- Add visualization (charts, graphs)
- Export to PDF
- Multi-stock portfolio analysis
- Email alerts for watchlist stocks
- Backtesting to track accuracy
- Web interface for easy access

---

## Why This Matters

**For Investors:** Get professional-quality research reports in minutes instead of hours
**For Developers:** Learn how to build multi-agent AI systems with real-world data
**For AI Enthusiasts:** See practical application of agent collaboration patterns

This isn't just a ChatGPT wrapper - it's a real system that combines multiple specialized AI agents with live data sources to automate a complex research workflow.

---

## Tech Details for Curious Developers

**Agent Instructions:** Each agent has detailed prompts that:
- List exactly which tools they have access to
- Provide clear analysis frameworks
- Include current datetime for context
- Explicitly prevent follow-up questions

**Knowledge Graph:** Uses MCP memory server for:
- Storing entities (companies, metrics, events)
- Creating relations between entities
- Retrieving past research for context

**Parallel Execution:** Uses `asyncio.gather()` to run all 4 analysts simultaneously:
```python
results = await asyncio.gather(
    financial_agent.run(),
    technical_agent.run(),
    news_agent.run(),
    comparative_agent.run()
)
```

**Context Injection:** Each agent gets rich, tool-specific prompts telling them:
- What data to gather
- How to use knowledge graph
- What format to output
- When to stop (no follow-ups!)

---

Built with ❤️ to show the power of collaborative AI agents.
