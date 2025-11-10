"""Comprehensive test script for all AutoStack API features."""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def print_section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

def test_health():
    """Test health endpoint."""
    print_section("1. Testing Health Endpoint")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200, "Health check failed!"
    print("✅ Health endpoint works")

def test_auth():
    """Test authentication endpoints."""
    print_section("2. Testing Authentication")
    
    # Signup
    print("\n2.1 Testing Signup...")
    signup_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/signup", json=signup_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        user_data = response.json()
        print(f"User created: {user_data.get('email')}")
        print("✅ Signup works")
    elif response.status_code == 409:
        print("User already exists (expected)")
        print("✅ Signup correctly prevents duplicates")
    else:
        print(f"❌ Signup failed: {response.text}")
        return None
    
    # Login
    print("\n2.2 Testing Login...")
    response = requests.post(f"{BASE_URL}/login", json=signup_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        print(f"Access token received: {access_token[:20]}...")
        print(f"Refresh token received: {refresh_token[:20]}...")
        print("✅ Login works with refresh token")
        return access_token, refresh_token
    else:
        print(f"❌ Login failed: {response.text}")
        return None, None

def test_me(token):
    """Test /me endpoint."""
    print_section("3. Testing /me Endpoint")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/me", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        user_data = response.json()
        print(f"User: {user_data.get('email')}")
        print("✅ /me endpoint works")
    else:
        print(f"❌ /me failed: {response.text}")

def test_refresh_token(refresh_token):
    """Test refresh token endpoint."""
    print_section("4. Testing Refresh Token")
    response = requests.post(
        f"{BASE_URL}/refresh",
        json={"refresh_token": refresh_token}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        new_access_token = token_data.get('access_token')
        print(f"New access token received: {new_access_token[:20]}...")
        print("✅ Refresh token works")
        return new_access_token
    else:
        print(f"❌ Refresh token failed: {response.text}")
        return None

def test_agents(token):
    """Test agents endpoints."""
    print_section("5. Testing Agents API")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Register agent
    print("\n5.1 Testing Agent Registration...")
    agent_data = {
        "name": "Test-Agent",
        "host": "test-server",
        "ip": "192.168.1.100"
    }
    response = requests.post(f"{BASE_URL}/agents/register", json=agent_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        agent = response.json()
        agent_id = agent.get('id')
        print(f"Agent registered: {agent.get('name')} (ID: {agent_id})")
        print("✅ Agent registration works")
    else:
        print(f"❌ Agent registration failed: {response.text}")
        return None
    
    # Heartbeat
    print("\n5.2 Testing Agent Heartbeat...")
    heartbeat_data = {
        "agent_id": agent_id,
        "cpu_usage": 45.5,
        "memory_usage": 62.3
    }
    response = requests.post(f"{BASE_URL}/agents/heartbeat", json=heartbeat_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        agent = response.json()
        print(f"Agent updated: CPU={agent.get('cpu_usage')}%, Memory={agent.get('memory_usage')}%")
        print("✅ Agent heartbeat works")
    else:
        print(f"❌ Agent heartbeat failed: {response.text}")
    
    # List agents
    print("\n5.3 Testing List Agents...")
    response = requests.get(f"{BASE_URL}/agents", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        agents = response.json()
        print(f"Found {len(agents)} agent(s)")
        print("✅ List agents works")
    else:
        print(f"❌ List agents failed: {response.text}")
    
    return agent_id

def test_alerts(token):
    """Test alerts endpoints."""
    print_section("6. Testing Alerts API")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create alert
    print("\n6.1 Testing Create Alert...")
    alert_data = {
        "severity": "critical",
        "source": "test-service",
        "message": "Test alert message"
    }
    response = requests.post(f"{BASE_URL}/alerts", json=alert_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        alert = response.json()
        alert_id = alert.get('id')
        print(f"Alert created: {alert.get('severity')} - {alert.get('source')}")
        print("✅ Create alert works")
    else:
        print(f"❌ Create alert failed: {response.text}")
        return None
    
    # List alerts
    print("\n6.2 Testing List Alerts...")
    response = requests.get(f"{BASE_URL}/alerts", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        alerts = response.json()
        print(f"Found {len(alerts)} alert(s)")
        print("✅ List alerts works")
    else:
        print(f"❌ List alerts failed: {response.text}")
    
    # Update alert
    print("\n6.3 Testing Update Alert...")
    update_data = {"resolved": True}
    response = requests.patch(f"{BASE_URL}/alerts/{alert_id}", json=update_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        alert = response.json()
        print(f"Alert updated: resolved={alert.get('resolved')}")
        print("✅ Update alert works")
    else:
        print(f"❌ Update alert failed: {response.text}")
    
    # Test webhook
    print("\n6.4 Testing Webhook...")
    webhook_data = {
        "webhook_url": "https://httpbin.org/post",
        "message": "Test webhook message"
    }
    response = requests.post(f"{BASE_URL}/alerts/test-webhook", json=webhook_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Webhook test: {result.get('detail')}")
        print("✅ Webhook test works")
    else:
        print(f"❌ Webhook test failed: {response.text}")
    
    return alert_id

def test_metrics(token):
    """Test metrics endpoint."""
    print_section("7. Testing Metrics API")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/metrics/overview", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        metrics = response.json()
        print(f"Metrics Overview:")
        print(f"  CPU Usage: {metrics.get('total_cpu_usage')}%")
        print(f"  Memory Usage: {metrics.get('total_memory_usage')}%")
        print(f"  Uptime: {metrics.get('uptime_percentage')}%")
        print(f"  Active Agents: {metrics.get('active_agents')}/{metrics.get('total_agents')}")
        print("✅ Metrics overview works")
    else:
        print(f"❌ Metrics overview failed: {response.text}")

def test_api_keys(token):
    """Test API keys endpoints."""
    print_section("8. Testing API Keys API")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create API key
    print("\n8.1 Testing Create API Key...")
    api_key_data = {"name": "Test API Key"}
    response = requests.post(f"{BASE_URL}/api-keys", json=api_key_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        api_key_obj = response.json()
        api_key = api_key_obj.get('key')
        key_id = api_key_obj.get('id')
        print(f"API key created: {api_key_obj.get('name')}")
        print(f"Key: {api_key[:20]}...")
        print("✅ Create API key works")
        
        # Test API key authentication
        print("\n8.2 Testing API Key Authentication...")
        api_key_headers = {"X-API-Key": api_key}
        response = requests.get(f"{BASE_URL}/me", headers=api_key_headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            user_data = response.json()
            print(f"Authenticated with API key: {user_data.get('email')}")
            print("✅ API key authentication works")
        else:
            print(f"❌ API key authentication failed: {response.text}")
    else:
        print(f"❌ Create API key failed: {response.text}")
        return None
    
    # List API keys
    print("\n8.3 Testing List API Keys...")
    response = requests.get(f"{BASE_URL}/api-keys", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        api_keys = response.json()
        print(f"Found {len(api_keys)} API key(s)")
        print("✅ List API keys works")
    else:
        print(f"❌ List API keys failed: {response.text}")
    
    return key_id

def test_audit_logs(token):
    """Test audit logs endpoint."""
    print_section("9. Testing Audit Logs API")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/audit-logs", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        logs = response.json()
        print(f"Found {len(logs)} audit log(s)")
        if logs:
            print(f"Latest action: {logs[0].get('action')}")
        print("✅ Audit logs works")
    else:
        print(f"❌ Audit logs failed: {response.text}")

def test_deployments(token):
    """Test deployment endpoints."""
    print_section("10. Testing Deployments API")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create deployment
    print("\n10.1 Testing Create Deployment...")
    deploy_data = {
        "repo": "https://github.com/test/repo",
        "branch": "main",
        "environment": "production"
    }
    response = requests.post(f"{BASE_URL}/deploy", json=deploy_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        deploy = response.json()
        deploy_id = deploy.get('deploy_id')
        print(f"Deployment created: {deploy_id}")
        print("✅ Create deployment works")
    else:
        print(f"❌ Create deployment failed: {response.text}")
        return None
    
    # List deployments
    print("\n10.2 Testing List Deployments...")
    response = requests.get(f"{BASE_URL}/deployments", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        deployments = response.json()
        deploy_list = deployments.get('deployments', [])
        print(f"Found {len(deploy_list)} deployment(s)")
        print("✅ List deployments works")
    else:
        print(f"❌ List deployments failed: {response.text}")
    
    # Get deployment status
    print("\n10.3 Testing Get Deployment Status...")
    time.sleep(2)  # Wait for background task
    response = requests.get(f"{BASE_URL}/status/{deploy_id}", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        deploy = response.json()
        print(f"Deployment status: {deploy.get('status')}")
        print("✅ Get deployment status works")
    else:
        print(f"❌ Get deployment status failed: {response.text}")
    
    return deploy_id

def test_rate_limiting():
    """Test rate limiting."""
    print_section("11. Testing Rate Limiting")
    print("Sending 6 requests to /login (limit: 5 per minute)...")
    
    for i in range(6):
        response = requests.post(
            f"{BASE_URL}/login",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )
        print(f"Request {i+1}: Status {response.status_code}")
        if response.status_code == 429:
            print("✅ Rate limiting works!")
            return
    
    print("⚠️  Rate limiting may not be working as expected")

def main():
    """Run all tests."""
    print("=" * 60)
    print("AutoStack API - Comprehensive Feature Test")
    print("=" * 60)
    print("\nMake sure the server is running on http://127.0.0.1:8000")
    print("Waiting 2 seconds for server to be ready...")
    time.sleep(2)
    
    try:
        # Basic tests
        test_health()
        
        # Auth tests
        access_token, refresh_token = test_auth()
        if not access_token:
            print("\n❌ Authentication failed. Cannot continue with other tests.")
            return
        
        # Protected endpoint tests
        test_me(access_token)
        new_token = test_refresh_token(refresh_token)
        if new_token:
            access_token = new_token
        
        # Feature tests
        test_agents(access_token)
        test_alerts(access_token)
        test_metrics(access_token)
        test_api_keys(access_token)
        test_audit_logs(access_token)
        test_deployments(access_token)
        
        # Security tests
        test_rate_limiting()
        
        print("\n" + "=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()


