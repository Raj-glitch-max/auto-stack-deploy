"""Test authentication endpoints with PostgreSQL."""
import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"


def test_health():
    """Test health endpoint."""
    print("=" * 60)
    print("1. Testing /health endpoint")
    print("=" * 60)
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        if response.status_code == 200:
            print("✅ Health check passed!")
            return True
        else:
            print("❌ Health check failed!")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running?")
        print("   Start with: python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_signup():
    """Test signup endpoint."""
    print("\n" + "=" * 60)
    print("2. Testing /signup endpoint")
    print("=" * 60)
    
    signup_data = {
        "email": "new@example.com",
        "password": "pass1234"  # Minimum 8 characters required
    }
    
    print(f"Request: POST {BASE_URL}/signup")
    print(f"Body: {json.dumps(signup_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/signup",
            json=signup_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code in [201, 200]:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            print("✅ Signup successful!")
            return True, data
        elif response.status_code == 409:
            print(f"Response: {response.json()}")
            print("⚠️  User already exists (this is OK if running multiple times)")
            return True, None
        else:
            print(f"Response: {response.text}")
            print("❌ Signup failed!")
            return False, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None


def test_login():
    """Test login endpoint."""
    print("\n" + "=" * 60)
    print("3. Testing /login endpoint")
    print("=" * 60)
    
    login_data = {
        "email": "new@example.com",
        "password": "pass1234"  # Minimum 8 characters required
    }
    
    print(f"Request: POST {BASE_URL}/login")
    print(f"Body: {json.dumps(login_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            token = data.get("access_token")
            if token:
                print(f"\n✅ Login successful!")
                print(f"Token received: {token[:50]}...")
                return True, token
            else:
                print("❌ No token in response!")
                return False, None
        else:
            print(f"Response: {response.text}")
            print("❌ Login failed!")
            return False, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None


def test_me(token):
    """Test /me endpoint."""
    print("\n" + "=" * 60)
    print("4. Testing /me endpoint")
    print("=" * 60)
    
    print(f"Request: GET {BASE_URL}/me")
    print(f"Authorization: Bearer {token[:50]}...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            print("✅ /me endpoint works!")
            return True
        else:
            print(f"Response: {response.text}")
            print("❌ /me endpoint failed!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_invalid_login():
    """Test login with invalid credentials."""
    print("\n" + "=" * 60)
    print("5. Testing /login with invalid credentials")
    print("=" * 60)
    
    login_data = {
        "email": "new@example.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print(f"Response: {response.json()}")
            print("✅ Invalid login correctly rejected!")
            return True
        else:
            print(f"Response: {response.text}")
            print("⚠️  Unexpected status code")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_protected_without_token():
    """Test protected endpoint without token."""
    print("\n" + "=" * 60)
    print("6. Testing /me without token")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/me", timeout=5)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print(f"Response: {response.json()}")
            print("✅ Protected endpoint correctly requires authentication!")
            return True
        else:
            print(f"Response: {response.text}")
            print("⚠️  Unexpected status code")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("AutoStack Authentication Endpoint Tests")
    print("=" * 60)
    print("\nWaiting for server to be ready...")
    
    # Wait for server
    for i in range(10):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=2)
            if response.status_code == 200:
                break
        except:
            time.sleep(1)
    else:
        print("\n❌ Server not responding!")
        print("   Please start the server with:")
        print("   python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000")
        sys.exit(1)
    
    results = []
    
    # Test health
    results.append(("Health Check", test_health()))
    
    # Test signup
    signup_success, _ = test_signup()
    results.append(("Signup", signup_success))
    
    # Test login
    login_success, token = test_login()
    results.append(("Login", login_success))
    
    if token:
        # Test /me with token
        results.append(("Get Current User", test_me(token)))
    else:
        print("\n⚠️  Skipping /me test - no token available")
        results.append(("Get Current User", False))
    
    # Test invalid login
    results.append(("Invalid Login", test_invalid_login()))
    
    # Test protected endpoint without token
    results.append(("Protected Endpoint Auth", test_protected_without_token()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name:.<40} {status}")
    
    all_passed = all(r[1] for r in results)
    
    if all_passed:
        print("\n✅ All tests passed! Backend is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please review the output above.")
    
    return all_passed


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

