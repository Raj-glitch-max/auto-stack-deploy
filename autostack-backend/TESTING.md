# AutoStack Backend - Testing Guide

## ✅ Authentication System - Complete & Fixed

All authentication endpoints have been fixed and are ready for testing.

### Fixed Issues

1. **Models** - Converted from PostgreSQL UUID to String for SQLite compatibility
2. **CRUD** - Rewrote user functions with proper async typing
3. **Schemas** - Updated to Pydantic v2 with `from_attributes=True`
4. **Auth** - Complete JWT + bcrypt implementation
5. **Database** - Fixed path to correctly locate `autostack.db`
6. **Error Handling** - Proper HTTP status codes (400, 401, 403, 409)

### Available Endpoints

#### Public Endpoints
- `GET /health` - Health check
- `POST /signup` - Create new user
- `POST /login` - Authenticate user

#### Protected Endpoints (require JWT token)
- `GET /me` - Get current user info
- `POST /logout` - Logout placeholder
- `POST /reset-password` - Password reset stub
- `POST /deploy` - Create deployment
- `GET /deployments` - List user deployments
- `GET /status/{deploy_id}` - Get deployment status

### Manual Testing

#### 1. Start the Server

```bash
cd autostack-backend
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

#### 2. Test Signup (PowerShell)

```powershell
$body = @{
    email = "test@example.com"
    password = "testpass123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://127.0.0.1:8000/signup -Method POST -Body $body -ContentType "application/json"
```

Expected response:
```json
{
    "id": "uuid-string",
    "email": "test@example.com",
    "created_at": "2024-..."
}
```

#### 3. Test Login (PowerShell)

```powershell
$body = @{
    email = "test@example.com"
    password = "testpass123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://127.0.0.1:8000/login -Method POST -Body $body -ContentType "application/json"
$token = $response.access_token
Write-Host "Token: $token"
```

Expected response:
```json
{
    "access_token": "eyJ...",
    "token_type": "bearer"
}
```

#### 4. Test /me Endpoint (PowerShell)

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri http://127.0.0.1:8000/me -Method GET -Headers $headers
```

Expected response:
```json
{
    "id": "uuid-string",
    "email": "test@example.com",
    "created_at": "2024-..."
}
```

#### 5. Test Health Endpoint (PowerShell)

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/health -Method GET
```

Expected response:
```json
{
    "status": "healthy",
    "service": "autostack-api"
}
```

### Testing with curl (if available)

```bash
# Health check
curl http://127.0.0.1:8000/health

# Signup
curl -X POST http://127.0.0.1:8000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Get current user (replace TOKEN with actual token)
curl -X GET http://127.0.0.1:8000/me \
  -H "Authorization: Bearer TOKEN"
```

### Testing with Python requests

```python
import requests

BASE_URL = "http://127.0.0.1:8000"

# Signup
response = requests.post(
    f"{BASE_URL}/signup",
    json={"email": "test@example.com", "password": "testpass123"}
)
print(response.json())

# Login
response = requests.post(
    f"{BASE_URL}/login",
    json={"email": "test@example.com", "password": "testpass123"}
)
token = response.json()["access_token"]

# Get current user
response = requests.get(
    f"{BASE_URL}/me",
    headers={"Authorization": f"Bearer {token}"}
)
print(response.json())
```

### Expected Behavior

1. **Signup** - Creates user, returns 201 with user data
2. **Duplicate Signup** - Returns 409 Conflict
3. **Login** - Valid credentials return 200 with JWT token
4. **Invalid Login** - Returns 401 Unauthorized
5. **Protected Endpoints** - Without token returns 401
6. **Protected Endpoints** - With valid token returns data

### Environment Variables

Create a `.env` file (optional, defaults provided):

```env
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite+aiosqlite:///./autostack.db
```

### Database

The database file is located at: `autostack-backend/autostack.db`

Tables are automatically created on server startup.

### Notes

- All endpoints return JSON (no HTML)
- JWT tokens expire after 24 hours by default
- Password minimum length: 8 characters
- SQLite compatible (ready for PostgreSQL migration)



