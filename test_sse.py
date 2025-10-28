#!/usr/bin/env python3
"""
Simple test script to verify SSE functionality
"""
import requests
import json
import time

def test_research_start():
    """Test starting a research and getting session ID"""
    url = "http://localhost:5001/research/stock"
    data = {
        "symbol": "AAPL",
        "exchange": "US"
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Research started successfully")
            print(f"Session ID: {result.get('session_id')}")
            return result.get('session_id')
        else:
            print(f"❌ Failed to start research: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error starting research: {e}")
        return None

def test_sse_connection(session_id):
    """Test SSE connection"""
    url = f"http://localhost:5001/research/progress/{session_id}"
    
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            print(f"✅ SSE connection established")
            
            # Read first few messages
            count = 0
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = line[6:]  # Remove 'data: ' prefix
                        try:
                            parsed = json.loads(data)
                            print(f"📡 SSE Message: {parsed}")
                            count += 1
                            if count >= 5:  # Stop after 5 messages
                                break
                        except json.JSONDecodeError:
                            print(f"📡 Raw SSE: {data}")
        else:
            print(f"❌ SSE connection failed: {response.status_code}")
    except Exception as e:
        print(f"❌ SSE error: {e}")

if __name__ == "__main__":
    print("🧪 Testing SSE functionality...")
    
    # Test health check first
    try:
        response = requests.get("http://localhost:5001/health")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend health check failed")
            exit(1)
    except:
        print("❌ Backend is not running. Start with: python app.py")
        exit(1)
    
    # Test research start
    session_id = test_research_start()
    if session_id:
        print(f"\n🔄 Testing SSE for session: {session_id}")
        time.sleep(2)  # Give backend time to start processing
        test_sse_connection(session_id)
    else:
        print("❌ Cannot test SSE without session ID")