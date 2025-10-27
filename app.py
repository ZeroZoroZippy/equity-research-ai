from flask import Flask, request, jsonify
from flask_cors import CORS
from research_system import EquityResearchSystem
import asyncio
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Create research system instance
research_system = EquityResearchSystem()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/research/stock', methods=['POST'])
def research_stock():
    """
    Single stock research endpoint

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

        logger.info(f"Starting stock research for {symbol} ({exchange})")

        # Run async research in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            report = loop.run_until_complete(
                research_system.research_stock(symbol, exchange)
            )
        finally:
            loop.close()

        logger.info(f"Completed research for {symbol}")

        return jsonify({
            'success': True,
            'report': report,
            'symbol': symbol,
            'exchange': exchange,
            'timestamp': datetime.now().isoformat()
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
    Sector research endpoint

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
            num_companies = max(1, min(num_companies, 10))  # Clamp between 1-10
        except (ValueError, TypeError):
            num_companies = 5

        logger.info(f"Starting sector research for {sector} ({exchange}), {num_companies} companies")

        # Run async research in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            report = loop.run_until_complete(
                research_system.research_sector(sector, exchange, num_companies)
            )
        finally:
            loop.close()

        logger.info(f"Completed sector research for {sector}")

        return jsonify({
            'success': True,
            'report': report,
            'sector': sector,
            'exchange': exchange,
            'num_companies': num_companies,
            'timestamp': datetime.now().isoformat()
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
        'name': 'Equity Research AI API',
        'version': '1.0.0',
        'endpoints': {
            'health': 'GET /health',
            'stock_research': 'POST /research/stock',
            'sector_research': 'POST /research/sector'
        }
    })

if __name__ == '__main__':
    logger.info("Starting Equity Research AI API on http://localhost:5001")
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        threaded=True
    )
