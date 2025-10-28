from agents import Runner
from agents.mcp import MCPServerStdio
from research_agents import FinancialAnalyst, TechnicalAnalyst, NewsAnalyst, ComparativeAnalyst, ReportGenerator, StrategicAnalyst
from sector_agents import SectorAnalyst, PortfolioStrategist
import asyncio
import os
import re
from datetime import datetime
from dotenv import load_dotenv

# Optional IPython import for notebook display (not needed in production)
try:
    from IPython.display import display, Markdown
    IPYTHON_AVAILABLE = True
except ImportError:
    IPYTHON_AVAILABLE = False
    display = None
    Markdown = None


class ResearchCancelled(Exception):
    """Raised when a research session has been cancelled by the user."""
    pass

# Load environment variables
load_dotenv()

class EquityResearchSystem:
    """
    Multi-agent equity research system with TWO modes:
    1. Single Company Research - Deep dive into one stock
    2. Sector Research - Identify top companies and compare them
    """

    def __init__(self, progress_queues_ref=None, cancel_flags_ref=None):
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

        # Store reference to progress queues from app.py
        self.progress_queues_ref = progress_queues_ref
        self.cancel_flags_ref = cancel_flags_ref

    @staticmethod
    def _split_markdown_sections(markdown_text: str):
        """Split markdown text into sections keyed by their H2 heading titles."""
        if not markdown_text:
            return {}
        import re

        pattern = re.compile(r'^##\s+(.+)$', re.MULTILINE)
        sections = {}
        matches = list(pattern.finditer(markdown_text))

        if not matches:
            return sections

        for index, match in enumerate(matches):
            title = match.group(1).strip()
            start = match.end()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown_text)
            content = markdown_text[start:end].strip()
            sections[title] = content

        return sections

    @staticmethod
    def _extract_links(markdown_text: str):
        """Return unique hyperlinks discovered in the provided markdown text."""
        if not markdown_text:
            return []
        import re

        urls = re.findall(r'https?://[^\s)]+', markdown_text)
        # Preserve order while removing duplicates
        seen = set()
        unique_urls = []
        for url in urls:
            cleaned = url.rstrip('.,)')
            if cleaned not in seen:
                seen.add(cleaned)
                unique_urls.append(cleaned)
        return unique_urls

    def _log_status(self, message: str, session_id: str = None, agent: str = None):
        """Log status message and send to progress queue if available"""
        print(f"[LOG_STATUS] {message}")
        if session_id and self.progress_queues_ref is not None:
            try:
                print(f"[LOG_STATUS] Using progress_queues_ref, session_id={session_id}, exists={session_id in self.progress_queues_ref}")
                if session_id in self.progress_queues_ref:
                    update = {
                        'type': 'progress',
                        'message': message,
                        'timestamp': datetime.now().isoformat()
                    }
                    if agent:
                        update['agent'] = agent
                    print(f"[LOG_STATUS] Putting update in queue: {update}")
                    self.progress_queues_ref[session_id].put(update)
                    print(f"[LOG_STATUS] Update queued successfully")
                else:
                    print(f"[LOG_STATUS] Session {session_id} not found in progress_queues. Available: {list(self.progress_queues_ref.keys())}")
            except Exception as e:
                print(f"[LOG_STATUS] Error sending progress: {e}")
                import traceback
                traceback.print_exc()

    def _is_cancelled(self, session_id: str = None) -> bool:
        if session_id is None or self.cancel_flags_ref is None:
            return False
        return session_id in self.cancel_flags_ref

    def _throw_if_cancelled(self, session_id: str = None):
        if self._is_cancelled(session_id):
            raise ResearchCancelled(f"Session {session_id} cancelled by user")

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
        self._throw_if_cancelled(session_id)
        
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

Use ONLY the available market data tools. Do NOT attempt to use tools that don't exist.

Gather the following information:
- Current stock price, market cap, and key valuation ratios (P/E, P/B, etc.)
- Company profile and business description
- Financial statements (revenue, profit, cash flow, margins)
- Balance sheet health (debt levels, equity, cash position)
- Profitability metrics (ROE, ROA, profit margins)
- Growth metrics (revenue growth, earnings growth)

If a specific data point is not available through your tools, skip it and work with what you have.

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
        self._throw_if_cancelled(session_id)
        self._log_status("Financial Analyst started...", session_id, "Financial Analyst")
        try:
            financial_result = await Runner.run(financial_agent, fundamental_prompt, max_turns=20)
            financial_analysis = financial_result.final_output
            self._log_status("Financial Analyst completed", session_id, "Financial Analyst")
        except Exception as e:
            financial_analysis = f"Financial analysis unavailable due to error: {str(e)}"
            self._log_status(f"Financial Analyst encountered an error: {str(e)}", session_id, "Financial Analyst")
            print(f"[ERROR] Financial Analyst failed: {e}")

        self._throw_if_cancelled(session_id)
        self._log_status("Technical Analyst started...", session_id, "Technical Analyst")
        try:
            technical_result = await Runner.run(technical_agent, technical_prompt, max_turns=20)
            technical_analysis = technical_result.final_output
            self._log_status("Technical Analyst completed", session_id, "Technical Analyst")
        except Exception as e:
            technical_analysis = f"Technical analysis unavailable due to error: {str(e)}"
            self._log_status(f"Technical Analyst encountered an error: {str(e)}", session_id, "Technical Analyst")
            print(f"[ERROR] Technical Analyst failed: {e}")

        self._throw_if_cancelled(session_id)
        self._log_status("News Analyst started...", session_id, "News Analyst")
        try:
            news_result = await Runner.run(news_agent, news_prompt, max_turns=14)
            news_analysis = news_result.final_output
            self._log_status("News Analyst completed", session_id, "News Analyst")
        except Exception as e:
            error_text = str(e)
            if "Max turns" in error_text:
                self._log_status(
                    "News Analyst hit the time limit while gathering fresh coverage; providing limited update.",
                    session_id,
                    "News Analyst",
                )
                fallback_prompt = f"""
You attempted to research {full_symbol} for news within the last 30 days but ran out of time.
Using the partial information you already gathered (even if minimal), write a concise update.
If you truly found no qualifying articles, clearly state that recent coverage is sparse and note any
relevant context you discovered along the way. Do NOT perform additional searches.
"""
                try:
                    fallback_agent = NewsAnalyst.create_agent(news_servers)
                    fallback_result = await Runner.run(fallback_agent, fallback_prompt, max_turns=4)
                    news_analysis = fallback_result.final_output
                    self._log_status(
                        "News Analyst provided a limited recent news summary.",
                        session_id,
                        "News Analyst",
                    )
                except Exception as fallback_error:
                    news_analysis = "News coverage in the last 30 days appears sparse; unable to retrieve detailed articles after multiple attempts."
                    self._log_status(
                        "News Analyst reported that recent coverage is sparse.",
                        session_id,
                        "News Analyst",
                    )
                    print(f"[WARN] News Analyst fallback failed: {fallback_error}")
            else:
                news_analysis = f"News analysis unavailable due to error: {error_text}"
                self._log_status(f"News Analyst encountered an error: {error_text}", session_id, "News Analyst")
                print(f"[ERROR] News Analyst failed: {e}")

        self._throw_if_cancelled(session_id)
        self._log_status("Risk Analyst started...", session_id, "Risk Analyst")
        try:
            comparative_result = await Runner.run(comparative_agent, comparative_prompt, max_turns=20)
            comparative_analysis = comparative_result.final_output
            self._log_status("Risk Analyst completed", session_id, "Risk Analyst")
        except Exception as e:
            comparative_analysis = f"Comparative analysis unavailable due to error: {str(e)}"
            self._log_status(f"Risk Analyst encountered an error: {str(e)}", session_id, "Risk Analyst")
            print(f"[ERROR] Risk Analyst failed: {e}")

        # Synthesize into formal report
        self._throw_if_cancelled(session_id)
        self._log_status("Report Generator started...", session_id, "Report Generator")
        
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
        
        self._throw_if_cancelled(session_id)
        report_result = await Runner.run(report_agent, synthesis_prompt, max_turns=3)
        formal_report = report_result.final_output
        self._log_status("Report Generator completed", session_id, "Report Generator")

        # Add the strategic analysis
        self._log_status("Generating final report...", session_id, "Strategic Analyst")
        
        strategic_agent = StrategicAnalyst.create_agent()
        
        strategic_prompt = f"""
You have the complete research report on {full_symbol}. 

Your job: Think deeply about the strategic implications. 
Connect the dots. Predict what happens next. Give your honest take.

FULL REPORT:

{formal_report}

Now provide your strategic analysis following your structured format.
"""
        
        self._throw_if_cancelled(session_id)
        strategic_result = await Runner.run(strategic_agent, strategic_prompt, max_turns=3)
        strategic_take = strategic_result.final_output
        
        # Combine formal report + strategic take
        final_report = formal_report + "\n\n---\n\n" + strategic_take
        generated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        formal_sections = self._split_markdown_sections(formal_report)
        news_links = self._extract_links(
            (news_analysis or '') + '\n' + formal_sections.get('News & Sentiment Summary', '')
        )

        report_bundle = {
            "full_report": final_report,
            "sections": {
                "executive_summary": formal_sections.get('Executive Summary', '').strip(),
                "fundamental": formal_sections.get('Fundamental Analysis Summary', '').strip(),
                "technical": formal_sections.get('Technical Analysis Summary', '').strip(),
                "news": formal_sections.get('News & Sentiment Summary', '').strip(),
                "comparison": formal_sections.get('Peer Comparison Summary', '').strip(),
                "synthesis": formal_sections.get('Synthesis & Investment Considerations', '').strip(),
                "risk": formal_sections.get('Risk Assessment', '').strip(),
                "strategic": strategic_take.strip(),
            },
            "analyses": {
                "financial": financial_analysis,
                "technical": technical_analysis,
                "news": news_analysis,
                "comparative": comparative_analysis,
                "strategic": strategic_take,
            },
            "sources": {
                "news_links": news_links,
            },
            "metadata": {
                "generated_at": generated_at,
                "symbol": full_symbol,
                "exchange": exchange,
                "session_id": session_id,
                "type": "stock",
            },
        }

        self._log_status("Research completed successfully!", session_id, "Strategic Analyst")

        return report_bundle
    
    
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
        self._throw_if_cancelled(session_id)
        
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
            self._throw_if_cancelled(session_id)

            # Use the helper function
            final_report = await self._research_stock_with_servers(
                symbol, exchange, yahoo_server, brave_server, session_id
            )

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

        self._log_status(f"Starting SECTOR research on {sector}...", session_id, "Sector Analyst")
        self._throw_if_cancelled(session_id)

        # Small delay to ensure clean async state
        await asyncio.sleep(1)
        self._throw_if_cancelled(session_id)

        sector_analysis = ""
        tickers = []

        try:
            # STEP 1: Identify top companies (separate connection for search)
            self._log_status("Step 1: Identifying top companies in sector...", session_id, "Sector Analyst")

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

                self._log_status("Sector Analyst completed Step 1: Top companies identified!", session_id, "Sector Analyst")
                self._log_status(f"Found companies: {sector_analysis[:200]}...", session_id, "Sector Analyst")

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
        self._log_status(f"Will analyze: {', '.join(tickers)}", session_id, "Sector Analyst")

        # STEP 2: Research all companies using ONE set of connected servers
        self._log_status(f"Step 2: Researching {len(tickers)} companies...", session_id, "Financial Analyst")
        
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
            self._throw_if_cancelled(session_id)

            # Now research each company using the SAME connected servers
            for i, ticker in enumerate(tickers, 1):
                self._throw_if_cancelled(session_id)
                self._log_status(f"Company {i}/{len(tickers)}: {ticker}", session_id)

                try:
                    # Use helper function with existing connected servers
                    report_bundle = await self._research_stock_with_servers(
                        ticker, exchange, yahoo_server, brave_server, session_id
                    )
                    company_reports[ticker] = report_bundle

                except Exception as e:
                    self._log_status(f"Error researching {ticker}: {e}", session_id)
                    company_reports[ticker] = {
                        "full_report": f"Unable to complete research on {ticker}",
                        "metadata": {
                            "symbol": ticker,
                            "exchange": exchange,
                            "error": str(e),
                        }
                    }

            self._log_status(f"All {len(tickers)} companies researched!", session_id)

            # STEP 3: Portfolio Strategist compares (inside server context for clean async scope)
            self._throw_if_cancelled(session_id)
            self._log_status("Step 3: Portfolio Strategist analyzing...", session_id, "Portfolio Strategist")

            strategist = PortfolioStrategist.create_agent()

            # Combine all reports
            combined_reports = f"""# {sector} Sector Analysis

## Companies Analyzed:
{', '.join(tickers)}

## Individual Company Reports:

"""

            for ticker, report_bundle in company_reports.items():
                report_text = report_bundle.get("full_report") if isinstance(report_bundle, dict) else str(report_bundle)
                combined_reports += f"\n{'='*60}\n## {ticker} FULL REPORT\n{'='*60}\n\n{report_text}\n\n"

            portfolio_prompt = f"""You have detailed research reports on {len(tickers)} companies in the {sector} sector:

{combined_reports}

Now compare these companies and provide your portfolio recommendations.

Remember to:
1. Rank all {len(tickers)} companies from best to worst
2. Identify the #1 top pick
3. Suggest portfolio allocation (if investing $10,000)
4. Explain which companies to avoid

Be decisive and opinionated."""

            self._throw_if_cancelled(session_id)
            portfolio_result = await Runner.run(strategist, portfolio_prompt, max_turns=5)
            portfolio_recommendations = portfolio_result.final_output

            self._log_status("Portfolio analysis complete!", session_id, "Portfolio Strategist")
        
        # Combine everything
        self._throw_if_cancelled(session_id)
        final_sector_report = f"""# {sector} Sector Research Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

{sector_analysis}

---

{portfolio_recommendations}

---

## Detailed Company Reports

"""
        
        for ticker, report_bundle in company_reports.items():
            report_text = report_bundle.get("full_report") if isinstance(report_bundle, dict) else str(report_bundle)
            final_sector_report += f"\n## {ticker} - Detailed Analysis\n\n{report_text}\n\n---\n\n"

        self._throw_if_cancelled(session_id)
        self._log_status(f"SECTOR RESEARCH COMPLETE for {sector}!", session_id, "Sector Analyst")

        sector_payload = {
            "full_report": final_sector_report,
            "sector_summary": sector_analysis,
            "portfolio_recommendations": portfolio_recommendations,
            "company_reports": company_reports,
            "sections": {
                "sector_summary": sector_analysis,
                "portfolio": portfolio_recommendations,
            },
            "metadata": {
                "sector": sector,
                "exchange": exchange,
                "num_companies": len(tickers),
                "generated_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "session_id": session_id,
                "type": "sector",
            }
        }

        return sector_payload
