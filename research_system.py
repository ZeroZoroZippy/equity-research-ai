from agents import Runner
from agents.mcp import MCPServerStdio
from research_agents import FinancialAnalyst, TechnicalAnalyst, NewsAnalyst, ComparativeAnalyst, ReportGenerator, StrategicAnalyst
from sector_agents import SectorAnalyst, PortfolioStrategist
import asyncio
import os
import re
from datetime import datetime
from dotenv import load_dotenv
from IPython.display import display, Markdown

# Load environment variables
load_dotenv()

class EquityResearchSystem:
    """
    Multi-agent equity research system with TWO modes:
    1. Single Company Research - Deep dive into one stock
    2. Sector Research - Identify top companies and compare them
    """

    def __init__(self):
        # Yahoo Finance MCP - for stock data
        self.yahoo_server_params = {
            "command": "uvx",
            "args": ["mcp-yahoo-finance"]
        }

        # Brave Search MCP - for news search
        self.brave_server_params = {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-brave-search"],
            "env": {
                "BRAVE_API_KEY": os.getenv("BRAVE_API_KEY")
            }
        }

        # Store callbacks per session to handle multiple concurrent sessions
        self.session_callbacks = {}

    def _log_status(self, message: str, session_id: str = None):
        """Log status message and send to callback if available"""
        print(message)
        if session_id and session_id in self.session_callbacks:
            self.session_callbacks[session_id](message)

    async def _research_stock_with_servers(
        self,
        symbol: str,
        exchange: str,
        yahoo_server,
        brave_server,
        session_id: str = None
    ) -> str:
        """
        Internal helper: Research a stock using EXISTING connected servers.
        This is called by research_sector() to avoid nested server connections.
        """
        
        # Format symbol for Yahoo Finance
        if exchange == "NSE" or exchange == "INDIA":
            full_symbol = f"{symbol}.NS"
        elif exchange == "BSE":
            full_symbol = f"{symbol}.BO"
        else:
            full_symbol = symbol
        
        # Servers are ALREADY connected by the caller
        # Assign servers to different agents
        finance_servers = [yahoo_server]
        tech_servers = [yahoo_server]
        news_servers = [yahoo_server, brave_server]
        
        # Create all analyst agents
        financial_agent = FinancialAnalyst.create_agent(finance_servers)
        technical_agent = TechnicalAnalyst.create_agent(tech_servers)
        news_agent = NewsAnalyst.create_agent(news_servers)
        comparative_agent = ComparativeAnalyst.create_agent(finance_servers)

        # Create prompts for each analyst
        fundamental_prompt = f"""Analyze {full_symbol} stock from a fundamental perspective.

Use your market data tools to gather:
- Current stock price, market cap, and key valuation ratios
- Company profile and business description
- Financial statements (revenue, profit, cash flow, margins)
- Balance sheet health (debt levels, equity, cash position)
- Profitability metrics (ROE, ROA, profit margins)
- Growth metrics (revenue growth, earnings growth)

Provide a comprehensive fundamental analysis covering business model, financial health,
valuation vs peers, growth prospects, and any red flags you identify.

Current datetime: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Stock symbol: {full_symbol}"""

        technical_prompt = f"""Analyze {full_symbol} stock from a technical perspective.

Use your market data tools to gather:
- Current stock price and trading volume
- Historical price data (1 week, 1 month, 3 months, YTD, 1 year)
- 52-week high and low prices
- Price trends and momentum indicators
- Volume patterns

Provide a comprehensive technical analysis covering current trend, momentum, key price levels,
volatility, recent performance, and technical outlook.

Current datetime: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Stock symbol: {full_symbol}"""

        news_prompt = f"""Research {full_symbol} stock from a news and sentiment perspective.

Use your web search tools to find recent news (last 30 days) about:
- Major company announcements (partnerships, deals, product launches)
- Earnings reports and guidance
- Mergers, acquisitions, or strategic moves
- Regulatory news or legal developments

Take time to make multiple searches for comprehensive coverage.

Provide a comprehensive news and sentiment analysis covering recent developments, market sentiment,
upcoming catalysts, risks, and industry context.

Current datetime: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Stock symbol: {full_symbol}"""

        comparative_prompt = f"""Analyze {full_symbol} stock compared to its industry peers.

Use your market data tools to:
- Identify 3-5 direct competitors or similar companies in the same industry/sector
- Gather valuation metrics (P/E, P/B, P/S) for all companies
- Compare financial metrics (revenue, profit margins, ROE, ROA)
- Compare growth rates (revenue growth, earnings growth)

Provide a clear summary: Is {full_symbol} a good value compared to peers?

Current datetime: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Stock symbol: {full_symbol}"""

        # Run analysts sequentially with status updates
        self._log_status("Financial Analyst started...", session_id)
        financial_result = await Runner.run(financial_agent, fundamental_prompt, max_turns=20)
        financial_analysis = financial_result.final_output
        self._log_status("Financial Analyst completed", session_id)

        self._log_status("Technical Analyst started...", session_id)
        technical_result = await Runner.run(technical_agent, technical_prompt, max_turns=20)
        technical_analysis = technical_result.final_output
        self._log_status("Technical Analyst completed", session_id)

        self._log_status("News Analyst started...", session_id)
        news_result = await Runner.run(news_agent, news_prompt, max_turns=20)
        news_analysis = news_result.final_output
        self._log_status("News Analyst completed", session_id)

        self._log_status("Risk Analyst started...", session_id)
        comparative_result = await Runner.run(comparative_agent, comparative_prompt, max_turns=20)
        comparative_analysis = comparative_result.final_output
        self._log_status("Risk Analyst completed", session_id)

        # Synthesize into formal report
        self._log_status("Report Generator started...", session_id)
        
        report_agent = ReportGenerator.create_agent()
        
        synthesis_prompt = f"""
You have received analyses from four specialist analysts on {full_symbol}:

## FUNDAMENTAL ANALYSIS
{financial_analysis}

## TECHNICAL ANALYSIS
{technical_analysis}

## NEWS & SENTIMENT ANALYSIS
{news_analysis}

## PEER COMPARISON ANALYSIS
{comparative_analysis}

Please synthesize these into a comprehensive investment research report.
"""
        
        report_result = await Runner.run(report_agent, synthesis_prompt, max_turns=3)
        formal_report = report_result.final_output
        self._log_status("Report Generator completed", session_id)

        # Add the strategic analysis
        self._log_status("Generating final report...", session_id)
        
        strategic_agent = StrategicAnalyst.create_agent()
        
        strategic_prompt = f"""
You have the complete research report on {full_symbol}. 

Your job: Think deeply about the strategic implications. 
Connect the dots. Predict what happens next. Give your honest take.

FULL REPORT:

{formal_report}

Now provide your strategic analysis following your structured format.
"""
        
        strategic_result = await Runner.run(strategic_agent, strategic_prompt, max_turns=3)
        strategic_take = strategic_result.final_output
        
        # Combine formal report + strategic take
        final_report = formal_report + "\n\n---\n\n" + strategic_take

        self._log_status("Research completed successfully!", session_id)

        return final_report
    
    
    async def research_stock(self, symbol: str, exchange: str = "US", session_id: str = None) -> str:
        """
        MODE 1: Deep research on a SINGLE company
        
        Args:
            symbol: Stock ticker (e.g., 'AAPL', 'RELIANCE.NS')
            exchange: Market identifier ('US', 'NSE', 'BSE')
        
        Returns:
            Comprehensive research report with strategic take
        """
        
        self._log_status(f"Starting research on {symbol}...", session_id)
        
        # Format symbol for Yahoo Finance
        if exchange == "NSE" or exchange == "INDIA":
            full_symbol = f"{symbol}.NS"
        elif exchange == "BSE":
            full_symbol = f"{symbol}.BO"
        else:
            full_symbol = symbol
        
        async with MCPServerStdio(
            params=self.yahoo_server_params,
            client_session_timeout_seconds=1200
        ) as yahoo_server, MCPServerStdio(
            params=self.brave_server_params,
            client_session_timeout_seconds=1200
        ) as brave_server:

            # Connect servers
            self._log_status("Connecting to MCP servers...", session_id)
            await yahoo_server.connect()
            await brave_server.connect()
            self._log_status("Servers connected!", session_id)

            # Use the helper function
            final_report = await self._research_stock_with_servers(
                symbol, exchange, yahoo_server, brave_server, session_id
            )

            # Clear callback after research
            if session_id and session_id in self.session_callbacks:
                del self.session_callbacks[session_id]

            return final_report
    
    
    async def research_sector(self, sector: str, exchange: str = "US", num_companies: int = 5, session_id: str = None) -> str:
        """
        MODE 2: Research an entire SECTOR

        Args:
            sector: Sector name (e.g., 'Technology', 'Banking')
            exchange: Market identifier ('US', 'NSE', 'BSE')
            num_companies: How many top companies to analyze (1-10)

        Returns:
            Sector research report with rankings and recommendations

        Note: Each sector research takes 10-20 minutes. Don't run multiple
        sector researches in the same cell - run them separately.
        """

        num_companies = min(num_companies, 10)

        self._log_status(f"Starting SECTOR research on {sector}...", session_id)

        # Small delay to ensure clean async state
        await asyncio.sleep(1)

        sector_analysis = ""
        tickers = []

        try:
            # STEP 1: Identify top companies (separate connection for search)
            self._log_status("Step 1: Identifying top companies in sector...", session_id)

            async with MCPServerStdio(
                params=self.brave_server_params,
                client_session_timeout_seconds=1200
            ) as search_server:

                await search_server.connect()

                sector_agent = SectorAnalyst.create_agent([search_server])

                sector_prompt = f"""Identify the top {num_companies} public companies in the {sector} sector.

Focus on the {exchange} market.

Use web search to find market leaders by market capitalization.

For each company provide:
- Company name
- Stock ticker symbol
- Exchange
- Brief description

Deliver a clear list of {num_companies} companies with accurate ticker symbols."""

                sector_result = await Runner.run(sector_agent, sector_prompt, max_turns=15)
                sector_analysis = sector_result.final_output

                self._log_status("Top companies identified!", session_id)
                self._log_status(f"Found companies: {sector_analysis[:200]}...", session_id)

        except Exception as e:
            self._log_status(f"Error in sector identification: {e}", session_id)
            return f"Failed to identify companies in {sector} sector: {e}"
        
        # Extract ticker symbols
        ticker_pattern = r'\(([A-Z]+(?:\.[A-Z]+)?)\s*(?:,\s*[A-Z]+)?\)'
        tickers = re.findall(ticker_pattern, sector_analysis)
        
        if not tickers:
            self._log_status("Could not extract tickers automatically.", session_id)
            return sector_analysis

        tickers = tickers[:num_companies]
        self._log_status(f"Will analyze: {', '.join(tickers)}", session_id)

        # STEP 2: Research all companies using ONE set of connected servers
        self._log_status(f"Step 2: Researching {len(tickers)} companies...", session_id)
        
        company_reports = {}
        
        # Connect servers ONCE outside the loop
        # Increased timeout for multi-company research
        async with MCPServerStdio(
            params=self.yahoo_server_params,
            client_session_timeout_seconds=1200  # 10 minutes total
        ) as yahoo_server, MCPServerStdio(
            params=self.brave_server_params,
            client_session_timeout_seconds=1200  # 10 minutes total
        ) as brave_server:
            
            # Connect once
            self._log_status("Connecting to research servers...", session_id)
            await yahoo_server.connect()
            await brave_server.connect()
            self._log_status("Servers connected for all company research!", session_id)

            # Now research each company using the SAME connected servers
            for i, ticker in enumerate(tickers, 1):
                self._log_status(f"Company {i}/{len(tickers)}: {ticker}", session_id)

                try:
                    # Use helper function with existing connected servers
                    report = await self._research_stock_with_servers(
                        ticker, exchange, yahoo_server, brave_server, session_id
                    )
                    company_reports[ticker] = report

                except Exception as e:
                    self._log_status(f"Error researching {ticker}: {e}", session_id)
                    company_reports[ticker] = f"Unable to complete research on {ticker}"

            self._log_status(f"All {len(tickers)} companies researched!", session_id)

            # STEP 3: Portfolio Strategist compares (inside server context for clean async scope)
            self._log_status("Step 3: Portfolio Strategist analyzing...", session_id)

            strategist = PortfolioStrategist.create_agent()

            # Combine all reports
            combined_reports = f"""# {sector} Sector Analysis

## Companies Analyzed:
{', '.join(tickers)}

## Individual Company Reports:

"""

            for ticker, report in company_reports.items():
                combined_reports += f"\n{'='*60}\n## {ticker} FULL REPORT\n{'='*60}\n\n{report}\n\n"

            portfolio_prompt = f"""You have detailed research reports on {len(tickers)} companies in the {sector} sector:

{combined_reports}

Now compare these companies and provide your portfolio recommendations.

Remember to:
1. Rank all {len(tickers)} companies from best to worst
2. Identify the #1 top pick
3. Suggest portfolio allocation (if investing $10,000)
4. Explain which companies to avoid

Be decisive and opinionated."""

            portfolio_result = await Runner.run(strategist, portfolio_prompt, max_turns=5)
            portfolio_recommendations = portfolio_result.final_output

            self._log_status("Portfolio analysis complete!", session_id)
        
        # Combine everything
        final_sector_report = f"""# {sector} Sector Research Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

{sector_analysis}

---

{portfolio_recommendations}

---

## Detailed Company Reports

"""
        
        for ticker, report in company_reports.items():
            final_sector_report += f"\n## {ticker} - Detailed Analysis\n\n{report}\n\n---\n\n"

        self._log_status(f"SECTOR RESEARCH COMPLETE for {sector}!", session_id)

        # Clear callback after research
        if session_id and session_id in self.session_callbacks:
            del self.session_callbacks[session_id]

        return final_sector_report