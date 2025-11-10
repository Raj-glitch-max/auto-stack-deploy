"""Test endpoints using HTTP requests"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_endpoints():
    """Test all authentication endpoints"""
    print("=" * 60)
    print("Testing AutoStack API Endpoints")
    print("=" * 60)
    
    # Wait for server to start
    print("\nWaiting for server to start...")
    for i in range(10):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=2)
            if response.status_code == 200:
                print("✅ Server is running!")
                break
        except:
            time.sleep(1)
    else:
        print("❌ Server not responding. Make sure it's running on port 8000")
        return
    
    # Test health endpoint
    print("\n1. Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    assert response.status_code == 200, "Health check failed!"
    print("   ✅ Health endpoint works")
    
    # Test signup
    print("\n2. Testing /signup endpoint...")
    signup_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    response = requests.post(
        f"{BASE_URL}/signup",
        json=signup_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 201:
        user_data = response.json()
        print(f"   User created: {user_data.get('email')} (ID: {user_data.get('id')})")
        print("   ✅ Signup works")
    elif response.status_code == 409:
        print("   User already exists (expected if running multiple times)")
        print("   ✅ Signup correctly prevents duplicates")
    else:
        print(f"   ❌ Signup failed: {response.text}")
        return
    
    # Test duplicate signup
    print("\n3. Testing duplicate signup...")
    response = requests.post(
        f"{BASE_URL}/signup",
        json=signup_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 409:
        print("   ✅ Duplicate signup correctly rejected")
    else:
        print(f"   ⚠️  Unexpected status: {response.status_code}")
    
    # Test login
    print("\n4. Testing /login endpoint...")
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    response = requests.post(
        f"{BASE_URL}/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        token = token_data.get("access_token")
        print(f"   Token received: {token[:50]}...")
        print("   ✅ Login works")
    else:
        print(f"   ❌ Login failed: {response.text}")
        return
    
    # Test invalid login
    print("\n5. Testing invalid login...")
    invalid_login = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }
    response = requests.post(
        f"{BASE_URL}/login",
        json=invalid_login,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        print("   ✅ Invalid login correctly rejected")
    else:
        print(f"   ⚠️  Unexpected status: {response.status_code}")
    
    # Test /me endpoint
    print("\n6. Testing /me endpoint...")
    response = requests.get(
        f"{BASE_URL}/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        user_data = response.json()
        print(f"   User: {user_data.get('email')} (ID: {user_data.get('id')})")
        print("   ✅ /me endpoint works")
    else:
        print(f"   ❌ /me failed: {response.text}")
    
    # Test protected endpoint without token
    print("\n7. Testing protected endpoint without token...")
    response = requests.get(f"{BASE_URL}/me")
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        print("   ✅ Protected endpoint correctly requires authentication")
    else:
        print(f"   ⚠️  Unexpected status: {response.status_code}")
    
    print("\n" + "=" * 60)
    print("✅ All endpoint tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_endpoints()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to server. Please start it with:")
        print("   uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()



