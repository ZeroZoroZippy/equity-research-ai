from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from research_system import EquityResearchSystem
import asyncio
from datetime import datetime
import logging
import json
import time
from queue import Queue
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for frontend with SSE support
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

# Store progress queues for active sessions
progress_queues = {}

# Create research system instance with reference to progress_queues
research_system = EquityResearchSystem(progress_queues_ref=progress_queues)

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
    Single stock research endpoint - starts research and returns session_id

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

        # Generate session ID
        session_id = f"stock_{symbol}_{int(time.time())}"
        
        # Create progress queue for this session
        progress_queues[session_id] = Queue()

        logger.info(f"Starting stock research for {symbol} ({exchange}), session: {session_id}")

        # Run research in background thread
        def run_research():
            # Small delay to ensure SSE connection is established first
            time.sleep(2)
            
            # Send initial message to confirm research started
            if session_id in progress_queues:
                progress_queues[session_id].put({
                    'type': 'progress',
                    'message': f'Research thread started for {symbol}',
                    'timestamp': datetime.now().isoformat()
                })
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                report = loop.run_until_complete(
                    research_system.research_stock(symbol, exchange, session_id)
                )
                # Send completion message
                if session_id in progress_queues:
                    progress_queues[session_id].put({
                        'type': 'complete',
                        'report': report,
                        'symbol': symbol,
                        'exchange': exchange
                    })
            except Exception as e:
                logger.error(f"Error in stock research: {str(e)}")
                if session_id in progress_queues:
                    progress_queues[session_id].put({
                        'type': 'error',
                        'error': str(e)
                    })
            finally:
                loop.close()

        thread = threading.Thread(target=run_research, daemon=True)
        thread.start()

        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Research started'
        })

    except Exception as e:
        logger.error(f"Error starting stock research: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/research/sector', methods=['POST'])
def research_sector():
    """
    Sector research endpoint - starts research and returns session_id

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

        # Generate session ID
        session_id = f"sector_{sector}_{int(time.time())}"
        
        # Create progress queue for this session
        progress_queues[session_id] = Queue()

        logger.info(f"Starting sector research for {sector} ({exchange}), {num_companies} companies, session: {session_id}")

        # Run research in background thread
        def run_research():
            # Small delay to ensure SSE connection is established first
            time.sleep(2)
            
            # Send initial message to confirm research started
            if session_id in progress_queues:
                progress_queues[session_id].put({
                    'type': 'progress',
                    'message': f'Sector research thread started for {sector}',
                    'timestamp': datetime.now().isoformat()
                })
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                report = loop.run_until_complete(
                    research_system.research_sector(sector, exchange, num_companies, session_id)
                )
                # Send completion message
                if session_id in progress_queues:
                    progress_queues[session_id].put({
                        'type': 'complete',
                        'report': report,
                        'sector': sector,
                        'exchange': exchange,
                        'num_companies': num_companies
                    })
            except Exception as e:
                logger.error(f"Error in sector research: {str(e)}")
                if session_id in progress_queues:
                    progress_queues[session_id].put({
                        'type': 'error',
                        'error': str(e)
                    })
            finally:
                loop.close()

        thread = threading.Thread(target=run_research, daemon=True)
        thread.start()

        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Sector research started'
        })

    except Exception as e:
        logger.error(f"Error starting sector research: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/research/progress/<session_id>')
def research_progress(session_id):
    """
    SSE endpoint for real-time research progress updates
    """
    def generate():
        if session_id not in progress_queues:
            logger.error(f"Session {session_id} not found in progress_queues")
            yield f"data: {json.dumps({'type': 'error', 'error': 'Invalid session'})}\n\n"
            return

        logger.info(f"Starting SSE stream for session {session_id}")
        queue = progress_queues[session_id]
        
        # Send initial connection message
        yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE stream connected'})}\n\n"
        
        while True:
            try:
                # Wait for updates with timeout
                update = queue.get(timeout=30)
                logger.info(f"Sending SSE update for {session_id}: {update}")
                yield f"data: {json.dumps(update)}\n\n"
                
                # If complete or error, cleanup and exit
                if update['type'] in ['complete', 'error']:
                    # Cleanup queue after a delay
                    threading.Timer(5.0, lambda: progress_queues.pop(session_id, None)).start()
                    break
                    
            except:
                # Send keepalive
                logger.debug(f"Sending keepalive for {session_id}")
                yield f"data: {json.dumps({'type': 'keepalive'})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )

@app.route('/')
def index():
    """Root endpoint with API info"""
    return jsonify({
        'name': 'Equity Research AI API',
        'version': '1.0.0',
        'endpoints': {
            'health': 'GET /health',
            'stock_research': 'POST /research/stock',
            'sector_research': 'POST /research/sector',
            'progress': 'GET /research/progress/<session_id>'
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
