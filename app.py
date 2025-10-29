from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from research_system import EquityResearchSystem, ResearchCancelled
import asyncio
from datetime import datetime
import logging
import json
import time
from queue import Queue
import threading
import os

try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth, firestore
except ImportError:
    firebase_admin = None
    firebase_auth = None
    firestore = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for frontend with SSE support
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",  # Local development
            "https://*.vercel.app",   # All Vercel deployments
            "*"  # Allow all for now, tighten later
        ],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

# Store progress queues for active sessions
progress_queues = {}
session_user_map = {}
session_cancel_flags = set()
firestore_client = None
firebase_app = None


def initialize_firebase():
    """Initialise Firebase Admin SDK and Firestore client if credentials are provided."""
    global firebase_app, firestore_client

    if firebase_admin is None:
        logger.error("firebase-admin is not installed. Install dependencies and configure Firebase.")
        return

    if firebase_app:
        return

    try:
        if firebase_admin._apps:
            firebase_app = firebase_admin.get_app()
        else:
            # Try JSON string first (for Render/cloud deployment)
            cred_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
            if cred_json:
                import json
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
                logger.info("Initialising Firebase using JSON credentials from environment")
            else:
                # Fall back to file path
                cred_path = os.getenv('FIREBASE_CREDENTIALS')
                if not cred_path:
                    # Fallback to bundled service account for local development
                    default_path = os.path.join(os.path.dirname(__file__), 'firebase-service-account.json')
                    if os.path.exists(default_path):
                        cred_path = default_path
                        logger.info("FIREBASE_CREDENTIALS not set; using default credentials at %s", cred_path)

                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    logger.info("Initialising Firebase using service account at %s", cred_path)
                else:
                    logger.info("Initialising Firebase using application default credentials.")
                    cred = credentials.ApplicationDefault()

            firebase_app = firebase_admin.initialize_app(cred)

        firestore_client = firestore.client()
        logger.info("Firebase initialised successfully.")
    except Exception as exc:
        firebase_app = None
        firestore_client = None
        logger.error("Failed to initialise Firebase Admin SDK: %s", exc)


def firebase_ready():
    return firebase_app is not None and firestore_client is not None


def verify_request_user():
    """Verify Firebase ID token from Authorization header and return user id."""
    if not firebase_ready():
        raise RuntimeError("Firebase is not configured. Please complete setup.")

    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        raise PermissionError("Missing or invalid Authorization header.")

    token = auth_header.split('Bearer ')[1].strip()
    if not token:
        raise PermissionError("Authorization token missing.")

    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded.get('uid'), decoded
    except Exception as exc:
        logger.error("Failed to verify Firebase token: %s", exc)
        raise PermissionError("Invalid authentication token.")


def history_collection(uid):
    if not firebase_ready():
        return None
    return firestore_client.collection('users').document(uid).collection('research_history')


def record_history_entry(uid, session_id, payload, merge=True, decoded=None):
    collection = history_collection(uid)
    if collection is None:
        return
    data = {k: v for k, v in payload.items() if v is not None}
    data.setdefault('session_id', session_id)
    if decoded:
        if decoded.get('email'):
            data.setdefault('user_email', decoded.get('email'))
        if decoded.get('name'):
            data.setdefault('user_name', decoded.get('name'))
    try:
        doc_ref = collection.document(session_id)
        if merge:
            doc_ref.set(data, merge=True)
        else:
            doc_ref.set(data)
    except Exception as exc:
        logger.error("Failed to record Firestore history for %s: %s", session_id, exc)


def upsert_user_profile(uid, decoded):
    if not firebase_ready() or not decoded:
        return
    profile_data = {
        'email': decoded.get('email'),
        'name': decoded.get('name'),
        'picture': decoded.get('picture'),
        'last_seen': datetime.now().isoformat(),
    }
    sanitized = {k: v for k, v in profile_data.items() if v}
    if not sanitized:
        return
    try:
        firestore_client.collection('users').document(uid).set(sanitized, merge=True)
    except Exception as exc:
        logger.error("Failed to upsert profile for %s: %s", uid, exc)


def mark_session_cancelled(session_id):
    if session_id:
        session_cancel_flags.add(session_id)


def clear_session_cancelled(session_id):
    if session_id and session_id in session_cancel_flags:
        session_cancel_flags.discard(session_id)

# Create research system instance with reference to progress_queues
research_system = EquityResearchSystem(progress_queues_ref=progress_queues, cancel_flags_ref=session_cancel_flags)

# Initialise Firebase on startup
initialize_firebase()

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
        try:
            uid, decoded_token = verify_request_user()
        except PermissionError as exc:
            return jsonify({'success': False, 'error': str(exc)}), 401
        except RuntimeError as exc:
            return jsonify({'success': False, 'error': str(exc)}), 500

        data = request.get_json() or {}

        symbol = data.get('symbol', '').strip().upper()
        exchange = data.get('exchange', 'US').upper()

        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400

        upsert_user_profile(uid, decoded_token)

        session_id = f"stock_{symbol}_{int(time.time())}"
        progress_queues[session_id] = Queue()
        session_user_map[session_id] = uid

        started_at = datetime.now().isoformat()

        record_history_entry(uid, session_id, {
            'type': 'stock',
            'symbol': symbol,
            'exchange': exchange,
            'status': 'queued',
            'started_at': started_at,
            'user_id': uid,
        }, merge=False, decoded=decoded_token)

        logger.info(
            "Starting stock research for %s (%s), session: %s, user: %s",
            symbol, exchange, session_id, uid
        )

        def run_research():
            time.sleep(2)

            if session_id in progress_queues:
                progress_queues[session_id].put({
                    'type': 'progress',
                    'message': f'Research thread started for {symbol}',
                    'timestamp': datetime.now().isoformat(),
                    'agent': 'System'
                })
                record_history_entry(uid, session_id, {
                    'status': 'running',
                    'last_message': f'Research thread started for {symbol}',
                }, decoded=decoded_token)

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                report_bundle = loop.run_until_complete(
                    research_system.research_stock(symbol, exchange, session_id)
                )

                completed_at = datetime.now().isoformat()
                record_history_entry(uid, session_id, {
                    'status': 'complete',
                    'completed_at': completed_at,
                    'report': report_bundle.get('full_report'),
                    'sections': report_bundle.get('sections'),
                    'analyses': report_bundle.get('analyses'),
                    'sources': report_bundle.get('sources'),
                    'metadata': report_bundle.get('metadata'),
                }, decoded=decoded_token)

                if session_id in progress_queues:
                    progress_queues[session_id].put({
                        'type': 'complete',
                        'report': report_bundle.get('full_report'),
                        'sections': report_bundle.get('sections'),
                        'analyses': report_bundle.get('analyses'),
                        'sources': report_bundle.get('sources'),
                        'metadata': report_bundle.get('metadata'),
                        'symbol': symbol,
                        'exchange': exchange,
                    })
            except ResearchCancelled:
                logger.info("Research cancelled for session %s", session_id)
                record_history_entry(uid, session_id, {
                    'status': 'cancelled',
                    'completed_at': datetime.now().isoformat(),
                }, decoded=decoded_token)
                if session_id in progress_queues:
                    progress_queues[session_id].put({
                        'type': 'cancelled',
                        'message': 'Research cancelled by user',
                        'symbol': symbol,
                        'exchange': exchange,
                    })
            except Exception as e:
                logger.error(f"Error in stock research: {str(e)}")
                record_history_entry(uid, session_id, {
                    'status': 'error',
                    'error': str(e),
                    'completed_at': datetime.now().isoformat(),
                }, decoded=decoded_token)
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
            'message': 'Research started',
            'user_id': uid,
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
        try:
            uid, decoded_token = verify_request_user()
        except PermissionError as exc:
            return jsonify({'success': False, 'error': str(exc)}), 401
        except RuntimeError as exc:
            return jsonify({'success': False, 'error': str(exc)}), 500

        data = request.get_json() or {}

        sector = data.get('sector', '').strip()
        exchange = data.get('exchange', 'US').upper()
        num_companies = data.get('num_companies', 5)

        if not sector:
            return jsonify({'error': 'Sector is required'}), 400

        try:
            num_companies = int(num_companies)
            num_companies = max(1, min(num_companies, 10))
        except (ValueError, TypeError):
            num_companies = 5

        upsert_user_profile(uid, decoded_token)

        session_id = f"sector_{sector}_{int(time.time())}"
        progress_queues[session_id] = Queue()
        session_user_map[session_id] = uid

        started_at = datetime.now().isoformat()

        record_history_entry(uid, session_id, {
            'type': 'sector',
            'sector': sector,
            'exchange': exchange,
            'num_companies': num_companies,
            'status': 'queued',
            'started_at': started_at,
            'user_id': uid,
        }, merge=False, decoded=decoded_token)

        logger.info(
            "Starting sector research for %s (%s), %s companies, session: %s, user: %s",
            sector, exchange, num_companies, session_id, uid
        )

        def run_research():
            time.sleep(2)

            if session_id in progress_queues:
                progress_queues[session_id].put({
                    'type': 'progress',
                    'message': f'Sector research thread started for {sector}',
                    'timestamp': datetime.now().isoformat(),
                    'agent': 'System'
                })
                record_history_entry(uid, session_id, {
                    'status': 'running',
                    'last_message': f'Sector research thread started for {sector}',
                }, decoded=decoded_token)

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                report_bundle = loop.run_until_complete(
                    research_system.research_sector(sector, exchange, num_companies, session_id)
                )

                completed_at = datetime.now().isoformat()
                record_history_entry(uid, session_id, {
                    'status': 'complete',
                    'completed_at': completed_at,
                    'report': report_bundle.get('full_report'),
                    'sections': report_bundle.get('sections'),
                    'metadata': report_bundle.get('metadata'),
                    'company_reports': report_bundle.get('company_reports'),
                }, decoded=decoded_token)

                if session_id in progress_queues:
                    progress_queues[session_id].put({
                        'type': 'complete',
                        'report': report_bundle.get('full_report'),
                        'sections': report_bundle.get('sections'),
                        'metadata': report_bundle.get('metadata'),
                        'company_reports': report_bundle.get('company_reports'),
                        'sector': sector,
                        'exchange': exchange,
                        'num_companies': num_companies
                    })
            except ResearchCancelled:
                logger.info("Sector research cancelled for session %s", session_id)
                record_history_entry(uid, session_id, {
                    'status': 'cancelled',
                    'completed_at': datetime.now().isoformat(),
                }, decoded=decoded_token)
                if session_id in progress_queues:
                    progress_queues[session_id].put({
                        'type': 'cancelled',
                        'message': 'Sector research cancelled by user',
                        'sector': sector,
                        'exchange': exchange,
                        'num_companies': num_companies
                    })
            except Exception as e:
                logger.error(f"Error in sector research: {str(e)}")
                record_history_entry(uid, session_id, {
                    'status': 'error',
                    'error': str(e),
                    'completed_at': datetime.now().isoformat(),
                }, decoded=decoded_token)
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
            'message': 'Sector research started',
            'user_id': uid,
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
    expected_user = session_user_map.get(session_id)
    if firebase_ready() and expected_user:
        token = request.args.get('token')
        if not token:
            logger.warning("SSE connection rejected for %s: missing auth token", session_id)
            return Response(
                json.dumps({'error': 'Unauthorized'}),
                status=401,
                mimetype='application/json'
            )
        try:
            decoded = firebase_auth.verify_id_token(token)
        except Exception as exc:
            logger.warning("SSE token verification failed for %s: %s", session_id, exc)
            return Response(
                json.dumps({'error': 'Unauthorized'}),
                status=401,
                mimetype='application/json'
            )
        if decoded.get('uid') != expected_user:
            logger.warning(
                "SSE token user mismatch for %s. Expected %s got %s",
                session_id,
                expected_user,
                decoded.get('uid')
            )
            return Response(
                json.dumps({'error': 'Forbidden'}),
                status=403,
                mimetype='application/json'
            )

    def cleanup_session():
        progress_queues.pop(session_id, None)
        session_user_map.pop(session_id, None)
        clear_session_cancelled(session_id)

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
                if update['type'] in ['complete', 'error', 'cancelled']:
                    # Cleanup queue after a delay
                    threading.Timer(5.0, cleanup_session).start()
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


@app.route('/history', methods=['GET'])
def list_history():
    """Return recent research history for authenticated user."""
    try:
        uid, decoded = verify_request_user()
    except PermissionError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 401
    except RuntimeError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500

    upsert_user_profile(uid, decoded)

    collection = history_collection(uid)
    if collection is None:
        return jsonify({'success': False, 'error': 'History storage not available'}), 500

    limit = request.args.get('limit', 10, type=int)

    try:
        query = collection.order_by('started_at', direction=firestore.Query.DESCENDING).limit(limit)
        docs = query.stream()
        history = []
        for doc in docs:
            item = doc.to_dict()
            item['session_id'] = doc.id
            # Avoid sending full report bodies in listing payload
            item.pop('report', None)
            history.append(item)
        return jsonify({'success': True, 'history': history})
    except Exception as exc:
        logger.error("Failed to fetch history for %s: %s", uid, exc)
        return jsonify({'success': False, 'error': 'Failed to fetch history'}), 500


@app.route('/history/<session_id>', methods=['GET'])
def get_history_entry(session_id):
    """Return specific research output for authenticated user."""
    try:
        uid, decoded = verify_request_user()
    except PermissionError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 401
    except RuntimeError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500

    upsert_user_profile(uid, decoded)
    collection = history_collection(uid)
    if collection is None:
        return jsonify({'success': False, 'error': 'History storage not available'}), 500

    try:
        doc = collection.document(session_id).get()
        if not doc.exists:
            return jsonify({'success': False, 'error': 'History entry not found'}), 404

        data = doc.to_dict()
        data['session_id'] = doc.id
        return jsonify({'success': True, 'entry': data})
    except Exception as exc:
        logger.error("Failed to load history entry %s for %s: %s", session_id, uid, exc)
        return jsonify({'success': False, 'error': 'Failed to load history entry'}), 500


@app.route('/history/<session_id>', methods=['DELETE'])
def delete_history_entry(session_id):
    """Delete a research history entry for the authenticated user."""
    try:
        uid, _ = verify_request_user()
    except PermissionError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 401
    except RuntimeError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500

    collection = history_collection(uid)
    if collection is None:
        return jsonify({'success': False, 'error': 'History storage not available'}), 500

    try:
        doc_ref = collection.document(session_id)
        doc = doc_ref.get()
        if not doc.exists:
            return jsonify({'success': False, 'error': 'History entry not found'}), 404
        doc_ref.delete()
        return jsonify({'success': True})
    except Exception as exc:
        logger.error("Failed to delete history entry %s for %s: %s", session_id, uid, exc)
        return jsonify({'success': False, 'error': 'Failed to delete history entry'}), 500


@app.route('/research/cancel/<session_id>', methods=['POST'])
def cancel_research(session_id):
    try:
        uid, decoded = verify_request_user()
    except PermissionError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 401
    except RuntimeError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500

    owner = session_user_map.get(session_id)
    if owner is None:
        return jsonify({'success': False, 'error': 'Session not found'}), 404
    if owner != uid:
        return jsonify({'success': False, 'error': 'Forbidden'}), 403

    mark_session_cancelled(session_id)
    record_history_entry(uid, session_id, {
        'status': 'cancelled',
        'completed_at': datetime.now().isoformat(),
    }, decoded=decoded)

    queue = progress_queues.get(session_id)
    if queue is not None:
        queue.put({
            'type': 'cancelled',
            'message': 'Research cancelled by user',
        })

    return jsonify({'success': True})

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
    # Use PORT from environment (for Render) or default to 5001
    port = int(os.environ.get('PORT', 5001))
    logger.info("Starting Equity Research AI API on http://0.0.0.0:%d", port)
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.environ.get('FLASK_ENV') != 'production',
        threaded=True
    )
