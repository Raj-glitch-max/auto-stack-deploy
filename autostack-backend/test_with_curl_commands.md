# Testing AutoStack Backend with curl Commands

## Prerequisites

Before testing, ensure:
1. PostgreSQL is running
2. Database `autostack` exists
3. Migrations have been run: `alembic upgrade head`
4. Server is running: `python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000`

## Test Commands

### 1. Health Check

```bash
curl -X GET http://127.0.0.1:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "autostack-api"
}
```

### 2. Signup

**Note:** Our implementation uses JSON (not form data). Password must be at least 8 characters.

```bash
curl -X POST http://127.0.0.1:8000/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "password": "pass1234"}'
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid-string",
  "email": "new@example.com",
  "created_at": "2024-..."
}
```

**Or (409 Conflict if user exists):**
```json
{
  "detail": "Email already registered"
}
```

### 3. Login

**Note:** Our implementation uses JSON with `email` field (not form data with `username`).

```bash
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "password": "pass1234"}'
```

**Expected Response (200 OK):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

**Or (401 Unauthorized):**
```json
{
  "detail": "Invalid email or password"
}
```

### 4. Get Current User

Replace `<your_jwt_token>` with the token from login:

```bash
curl -X GET http://127.0.0.1:8000/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "new@example.com",
  "created_at": "2024-..."
}
```

**Or (401 Unauthorized without token):**
```json
{
  "detail": "Not authenticated"
}
```

## PowerShell Alternative

If you're on Windows PowerShell, use these commands:

### 1. Health Check
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/health -Method GET
```

### 2. Signup
```powershell
$body = @{
    email = "new@example.com"
    password = "pass1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://127.0.0.1:8000/signup -Method POST -Body $body -ContentType "application/json"
```

### 3. Login
```powershell
$body = @{
    email = "new@example.com"
    password = "pass1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://127.0.0.1:8000/login -Method POST -Body $body -ContentType "application/json"
$token = $response.access_token
Write-Host "Token: $token"
```

### 4. Get Current User
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri http://127.0.0.1:8000/me -Method GET -Headers $headers
```

## Complete Test Flow

1. **Start Server:**
   ```bash
   python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Test Health:**
   ```bash
   curl http://127.0.0.1:8000/health
   ```

3. **Signup:**
   ```bash
   curl -X POST http://127.0.0.1:8000/signup \
     -H "Content-Type: application/json" \
     -d '{"email": "new@example.com", "password": "pass1234"}'
   ```

4. **Login:**
   ```bash
   curl -X POST http://127.0.0.1:8000/login \
     -H "Content-Type: application/json" \
     -d '{"email": "new@example.com", "password": "pass1234"}'
   ```
   Copy the `access_token` from the response.

5. **Get Current User:**
   ```bash
   curl -X GET http://127.0.0.1:8000/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## Troubleshooting

### 500 Internal Server Error on Signup/Login

This usually means:
- PostgreSQL is not running
- Database `autostack` doesn't exist
- Migrations haven't been run
- Connection string in `.env` is incorrect

**Solution:**
1. Check PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
2. Create database: `CREATE DATABASE autostack;`
3. Run migrations: `alembic upgrade head`
4. Check `.env` file has correct `DATABASE_URL`

### 401 Unauthorized

- Check password is correct (minimum 8 characters)
- Check email exists in database
- Verify token is valid and not expired

### Connection Refused

- Server is not running
- Wrong port (should be 8000)
- Firewall blocking connection

## Notes

- **Password Requirements:** Minimum 8 characters
- **Login Format:** Uses JSON with `email` field (not form data with `username`)
- **Token Expiry:** Default 24 hours (1440 minutes)
- **Database:** PostgreSQL required (not SQLite)




