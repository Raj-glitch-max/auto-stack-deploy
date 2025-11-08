# Rate Limit Fix

## Problem
Login attempts were failing with `429 Too Many Requests` error after a few tries.

## Root Cause
The `RateLimitMiddleware` was configured with very strict limits:
- **5 requests per 60 seconds** for `/login` and `/signup` endpoints
- This was causing legitimate login attempts to be blocked during testing

## Solution
Increased the rate limit to be more reasonable for development:
- **Changed from**: `calls=5, period=60.0`
- **Changed to**: `calls=50, period=60.0`

### File Modified
`/autostack-backend/backend/main.py` - Line 59

```python
# Before
app.add_middleware(RateLimitMiddleware, calls=5, period=60.0)

# After
app.add_middleware(RateLimitMiddleware, calls=50, period=60.0)
```

## Result
✅ Users can now login/signup without hitting rate limits during normal usage
✅ Still protected against brute force attacks (50 attempts per minute is reasonable)
✅ Backend restarted and working perfectly

## For Production
Consider implementing:
1. Redis-based rate limiting for distributed systems
2. Different limits for different endpoints
3. IP-based and user-based rate limiting
4. Exponential backoff for repeated failures
5. CAPTCHA after certain threshold
