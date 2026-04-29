import requests
import json

BASE_URL = "http://localhost:3000"

# Test 1: Without auth (should fail)
print("=" * 60)
print("TEST 1: Without Auth")
print("=" * 60)
try:
    response = requests.post(
        f"{BASE_URL}/api/orchestrate",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "mood": "friendly"
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Get session first
print("\n" + "=" * 60)
print("TEST 2: Check Session")
print("=" * 60)
try:
    session_response = requests.get(f"{BASE_URL}/api/auth/session")
    print(f"Session Status: {session_response.status_code}")
    print(f"Session: {session_response.text}")
except Exception as e:
    print(f"Error: {e}")