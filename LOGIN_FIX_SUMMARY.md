# Login/Signup Network Error Fix Summary

## Problem
The frontend was experiencing `net::ERR_CONNECTION_REFUSED` errors when trying to login or signup. The errors showed:
- `login (failed) net::ERR_CONNECTION_REFUSED`
- `signup (failed) net::ERR_CONNECTION_REFUSED`
- `/me (failed) net::ERR_CONNECTION_REFUSED`

## Root Causes Identified

### 1. Wrong API URL in Frontend Environment
- **File**: `/home/raj/Documents/Projects/autostack-frontend/.env.local`
- **Issue**: API URL was set to `http://localhost:8001` instead of `http://localhost:8000`
- **Fix**: Changed to `http://localhost:8000`

### 2. Next.js Build-Time Environment Variables
- **File**: `/home/raj/Documents/Projects/autostack-frontend/Dockerfile`
- **Issue**: Next.js bakes environment variables into the build at build time, but the Dockerfile was setting them AFTER the build step
- **Fix**: 
  - Added `ARG` declarations for `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_USE_MOCKS`
  - Set `ENV` variables before the `npm run build` step
  - Removed the `.env.docker` copy that happened after build

### 3. Docker Compose Build Args
- **File**: `/home/raj/Documents/Projects/docker-compose.yml`
- **Issue**: Build args weren't being passed to the Docker build process
- **Fix**: Added `args` section under `frontend.build` to pass environment variables at build time

### 4. Backend Timezone Issue
- **File**: `/home/raj/Documents/Projects/autostack-backend/backend/auth.py`
- **Issue**: Refresh token creation was using timezone-aware datetime, but database expected naive datetime
- **Fix**: Convert `expires_at` to naive datetime before storing: `expires_at_naive = expires_at.replace(tzinfo=None)`

### 5. CORS Configuration for Browser Preview
- **File**: `/home/raj/Documents/Projects/autostack-backend/backend/main.py`
- **Issue**: CORS only allowed `http://localhost:3000` but browser preview uses `http://127.0.0.1:<port>`
- **Fix**: Added `allow_origin_regex` to match all localhost and 127.0.0.1 origins with any port

## Files Modified

1. `/home/raj/Documents/Projects/autostack-frontend/.env.local`
   - Changed API URL from port 8001 to 8000

2. `/home/raj/Documents/Projects/autostack-frontend/Dockerfile`
   - Added ARG declarations for NEXT_PUBLIC_API_URL and NEXT_PUBLIC_USE_MOCKS
   - Added ENV settings before build step
   - Removed post-build .env.docker copy

3. `/home/raj/Documents/Projects/docker-compose.yml`
   - Added build args to frontend service

4. `/home/raj/Documents/Projects/autostack-backend/backend/auth.py`
   - Fixed timezone handling in refresh token creation

5. `/home/raj/Documents/Projects/autostack-backend/backend/main.py`
   - Added CORS regex pattern to allow all localhost and 127.0.0.1 origins

## Steps Taken

1. Started Docker containers: `docker-compose up -d`
2. Fixed `.env.local` API URL
3. Updated Dockerfile to set environment variables before build
4. Updated docker-compose.yml to pass build args
5. Fixed backend timezone issue
6. Rebuilt frontend container: `docker-compose build --no-cache frontend`
7. Restarted frontend: `docker-compose up -d frontend`
8. Fixed CORS configuration to allow browser preview origins
9. Restarted backend: `docker restart autostack-backend`

## Verification

All endpoints tested and working:
- ✅ Backend health check: `http://localhost:8000/health`
- ✅ Signup endpoint: `POST http://localhost:8000/signup`
- ✅ Login endpoint: `POST http://localhost:8000/login`
- ✅ User info endpoint: `GET http://localhost:8000/me`
- ✅ Frontend accessible: `http://localhost:3000`

## How to Test

1. Visit `http://localhost:3000/signup`
2. Create a new account with email and password
3. Login with the created credentials
4. You should be redirected to the dashboard

## Important Notes

- Next.js environment variables prefixed with `NEXT_PUBLIC_` are baked into the JavaScript bundle at BUILD time
- Any changes to these variables require rebuilding the frontend container
- The backend is running on port 8000, not 8001
- All Docker containers must be running for the application to work properly

## Commands for Future Reference

```bash
# Rebuild frontend after environment changes
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Check container status
docker ps

# View logs
docker logs autostack-backend --tail 50
docker logs autostack-frontend --tail 50

# Restart all services
docker-compose down
docker-compose up -d
```
