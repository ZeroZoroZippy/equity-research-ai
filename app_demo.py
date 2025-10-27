"""
Demo Flask Backend for Equity Research UI
This is a simplified version that generates mock research reports for testing the UI.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

def generate_mock_stock_report(symbol, exchange):
    """Generate a mock stock research report"""
    return f"""# {symbol} Stock Research Report
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Exchange:** {exchange}

## Executive Summary

{symbol} shows strong fundamentals with promising growth prospects. The stock is currently trading at moderate valuation levels with solid financial health indicators.

**Recommendation:** BUY
**Target Price:** $XXX.XX (XX% upside)
**Risk Rating:** Medium

## Financial Analysis

### Key Metrics
| Metric | Value | Industry Average |
|--------|-------|------------------|
| Market Cap | $XXX.XXB | - |
| P/E Ratio | XX.X | XX.X |
| Revenue Growth (YoY) | XX% | XX% |
| Profit Margin | XX% | XX% |
| ROE | XX% | XX% |
| Debt/Equity | X.XX | X.XX |

### Financial Health
- Strong balance sheet with manageable debt levels
- Consistent revenue growth over past 3 years
- Improving profit margins quarter-over-quarter
- Solid cash flow generation supporting operations and growth

## Technical Analysis

### Price Action
- Current Price: $XXX.XX
- 52-Week Range: $XXX.XX - $XXX.XX
- Relative Strength: Positive momentum
- Moving Averages: Trading above 50-day and 200-day MA

### Technical Indicators
- **Trend:** Uptrend with higher highs and higher lows
- **Support Level:** $XXX.XX
- **Resistance Level:** $XXX.XX
- **Volume:** Above average, indicating strong interest

## News & Sentiment Analysis

### Recent Developments
1. **Product Launch:** Company announced new product line expansion
2. **Earnings Beat:** Q4 earnings exceeded analyst expectations by XX%
3. **Partnership Deal:** Strategic partnership with major industry player
4. **Market Position:** Gaining market share in key segments

### Sentiment Overview
- **Analyst Ratings:** XX% Buy, XX% Hold, XX% Sell
- **News Sentiment:** Predominantly positive
- **Social Media:** Strong positive momentum

## Competitive Analysis

### Peer Comparison
{symbol} compares favorably against key competitors:

| Company | P/E | Growth | Market Position |
|---------|-----|---------|----------------|
| {symbol} | XX.X | XX% | Strong |
| Competitor A | XX.X | XX% | Moderate |
| Competitor B | XX.X | XX% | Strong |

### Competitive Advantages
- Strong brand recognition and customer loyalty
- Superior technology/product offering
- Efficient operations and cost structure
- Growing market share in key segments

## Investment Strategy

### Bull Case (60% probability)
- Continued market share gains
- Margin expansion from operational efficiency
- Successful new product launches
- Industry tailwinds supporting growth

### Base Case (30% probability)
- Steady growth in line with market expectations
- Stable margins and competitive position
- Moderate market expansion

### Bear Case (10% probability)
- Increased competition eroding margins
- Macroeconomic headwinds impacting demand
- Regulatory challenges

## Risk Factors

1. **Market Risk:** Exposure to broader market volatility
2. **Competition:** Intense competition in key segments
3. **Regulatory:** Potential regulatory changes affecting operations
4. **Execution:** Ability to execute on growth strategy

## Action Items

✅ **BUY** recommendation with XX% upside to target price

**Entry Points:**
- Primary: Current levels around $XXX.XX
- Secondary: $XXX.XX on pullback (strong support)

**Position Sizing:**
- Conservative: X% of portfolio
- Moderate: X% of portfolio
- Aggressive: X% of portfolio

**Time Horizon:** 12-18 months

**Stop Loss:** $XXX.XX (XX% below current price)

---

*This is a demo report generated for UI testing purposes. Actual reports will contain real data from AI agents analyzing financial statements, news, and market data.*

## Disclaimer

This analysis is for informational purposes only and should not be construed as investment advice. Always conduct your own research and consult with financial advisors before making investment decisions.

---

*Generated with ❤️ by Equity Research AI*
*Powered by 8 AI Agents working in parallel*
"""

def generate_mock_sector_report(sector, exchange, num_companies):
    """Generate a mock sector research report"""
    return f"""# {sector} Sector Research Report
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Exchange:** {exchange}
**Companies Analyzed:** {num_companies}

## Sector Overview

The {sector} sector demonstrates strong fundamentals with diverse opportunities across multiple sub-sectors. Our analysis covers the top {num_companies} companies by market capitalization.

## Top Companies Identified

1. **Company A** (SYMBOL1) - Market Cap: $XXX.XXB
2. **Company B** (SYMBOL2) - Market Cap: $XXX.XXB
3. **Company C** (SYMBOL3) - Market Cap: $XXX.XXB
4. **Company D** (SYMBOL4) - Market Cap: $XXX.XXB
5. **Company E** (SYMBOL5) - Market Cap: $XXX.XXB

## Comparative Analysis

| Company | Symbol | Rating | Score | P/E | Growth | ROE |
|---------|--------|--------|-------|-----|--------|-----|
| Company A | SYMB1 | **BUY** | 92/100 | XX.X | XX% | XX% |
| Company B | SYMB2 | **BUY** | 88/100 | XX.X | XX% | XX% |
| Company C | SYMB3 | **HOLD** | 75/100 | XX.X | XX% | XX% |
| Company D | SYMB4 | **HOLD** | 72/100 | XX.X | XX% | XX% |
| Company E | SYMB5 | **AVOID** | 58/100 | XX.X | XX% | XX% |

## Portfolio Recommendations

### Top Pick: Company A (SYMBOL1)

**Why we like it:**
- Leading market position
- Strong execution track record
- Attractive valuation relative to growth
- Best-in-class margins and returns

**Score Breakdown:**
- Valuation: 90/100
- Growth: 95/100
- Quality: 96/100

### Portfolio Allocation (for $10,000 investment)

1. **Company A** - 35% ($3,500) - Top pick with strongest fundamentals
2. **Company B** - 30% ($3,000) - Solid alternative with growth potential
3. **Company C** - 20% ($2,000) - Defensive holding for diversification
4. **Company D** - 10% ($1,000) - Speculative position
5. **Company E** - 5% ($500) - Small position, monitor closely

### Risk-Adjusted Returns

Our recommended allocation targets:
- **Expected Return:** 15-20% annually
- **Volatility:** Moderate (sector-relative)
- **Downside Protection:** Diversified across leaders
- **Rebalancing:** Quarterly review recommended

## Sector Trends & Catalysts

### Key Drivers
1. **Industry Growth:** XX% CAGR expected over next 5 years
2. **Technology Adoption:** Digital transformation accelerating
3. **Regulatory Environment:** Favorable policy developments
4. **Market Consolidation:** M&A activity creating opportunities

### Risks to Monitor
- Economic slowdown impacting demand
- Increased competition from new entrants
- Regulatory changes
- Geopolitical uncertainties

## Company Summaries

---

### Company A - Detailed Analysis

**Rating: BUY | Score: 92/100 | Target: $XXX (+XX%)**

Exceptional fundamentals with market leadership position. Strong balance sheet and consistent execution. Best risk/reward in the sector.

**Key Strengths:**
- Market leader with XX% market share
- Superior margins (XX%) vs peers
- Consistent double-digit growth
- Strong management team

**Valuation:** Attractive at current levels

---

### Company B - Detailed Analysis

**Rating: BUY | Score: 88/100 | Target: $XXX (+XX%)**

Strong secondary choice with growth potential. Solid financials and improving market position.

---

### Company C - Detailed Analysis

**Rating: HOLD | Score: 75/100 | Target: $XXX (+X%)**

Stable performer with defensive characteristics. Limited upside but provides portfolio stability.

---

### Company D - Detailed Analysis

**Rating: HOLD | Score: 72/100 | Target: $XXX (+X%)**

Turnaround story with execution risk. Speculative but could surprise to upside.

---

### Company E - Detailed Analysis

**Rating: AVOID | Score: 58/100**

Weak fundamentals and deteriorating competitive position. Better opportunities elsewhere.

---

## Action Plan

1. **Immediate:** Initiate positions in Companies A & B
2. **Near-term:** Add Company C on any pullback below $XXX
3. **Monitor:** Company D for signs of turnaround
4. **Avoid:** Company E until fundamentals improve

## Conclusion

The {sector} sector offers attractive opportunities with our recommended portfolio targeting 15-20% returns. Company A represents the best risk/reward, while the diversified approach provides downside protection.

---

*This is a demo report generated for UI testing purposes. Actual reports will contain real data from AI agents analyzing multiple companies in detail.*

**Disclaimer:** For informational purposes only. Not investment advice.

---

*Generated with ❤️ by Equity Research AI*
*Powered by 8 AI Agents analyzing {num_companies} companies in parallel*
"""

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'mode': 'demo',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/research/stock', methods=['POST'])
def research_stock():
    """
    Single stock research endpoint (DEMO MODE)

    Request body:
    {
        "symbol": "AAPL",
        "exchange": "US"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        symbol = data.get('symbol', '').strip().upper()
        exchange = data.get('exchange', 'US').upper()

        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400

        logger.info(f"[DEMO] Starting stock research for {symbol} ({exchange})")

        # Simulate research time (3-5 seconds for demo instead of 3-5 minutes)
        time.sleep(3)

        report = generate_mock_stock_report(symbol, exchange)

        logger.info(f"[DEMO] Completed research for {symbol}")

        return jsonify({
            'success': True,
            'report': report,
            'symbol': symbol,
            'exchange': exchange,
            'timestamp': datetime.now().isoformat(),
            'demo_mode': True
        })

    except Exception as e:
        logger.error(f"Error in stock research: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/research/sector', methods=['POST'])
def research_sector():
    """
    Sector research endpoint (DEMO MODE)

    Request body:
    {
        "sector": "Technology",
        "exchange": "US",
        "num_companies": 5
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        sector = data.get('sector', '').strip()
        exchange = data.get('exchange', 'US').upper()
        num_companies = data.get('num_companies', 5)

        if not sector:
            return jsonify({'error': 'Sector is required'}), 400

        # Validate num_companies
        try:
            num_companies = int(num_companies)
            num_companies = max(1, min(num_companies, 10))
        except (ValueError, TypeError):
            num_companies = 5

        logger.info(f"[DEMO] Starting sector research for {sector} ({exchange}), {num_companies} companies")

        # Simulate research time (5-8 seconds for demo instead of 10-20 minutes)
        time.sleep(5)

        report = generate_mock_sector_report(sector, exchange, num_companies)

        logger.info(f"[DEMO] Completed sector research for {sector}")

        return jsonify({
            'success': True,
            'report': report,
            'sector': sector,
            'exchange': exchange,
            'num_companies': num_companies,
            'timestamp': datetime.now().isoformat(),
            'demo_mode': True
        })

    except Exception as e:
        logger.error(f"Error in sector research: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/')
def index():
    """Root endpoint with API info"""
    return jsonify({
        'name': 'Equity Research AI API (Demo Mode)',
        'version': '1.0.0-demo',
        'mode': 'demo',
        'note': 'This is a demo backend generating mock reports for UI testing',
        'endpoints': {
            'health': 'GET /health',
            'stock_research': 'POST /research/stock',
            'sector_research': 'POST /research/sector'
        }
    })

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("🚀 Starting Equity Research AI API (DEMO MODE)")
    logger.info("=" * 60)
    logger.info("This is a demo backend for testing the UI")
    logger.info("It generates mock reports instead of real AI analysis")
    logger.info("Server running at: http://localhost:5001")
    logger.info("=" * 60)

    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        threaded=True
    )
