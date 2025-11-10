"""
Rate Limiting Middleware
Prevents brute force attacks and API abuse
"""
from datetime import datetime, timedelta
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import time

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with sliding window algorithm
    
    Limits:
    - Auth endpoints: 10 requests per minute per IP
    - API endpoints: 100 requests per minute per IP
    - Global: 1000 requests per minute per IP
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Store: {ip: {endpoint: [(timestamp, count)]}}
        self.requests: Dict[str, Dict[str, list]] = {}
        self.cleanup_interval = 60  # Clean up old entries every 60 seconds
        self.last_cleanup = time.time()
        
        # Rate limits by endpoint pattern
        self.limits = {
            "/signup": (10, 60),  # 10 requests per 60 seconds
            "/login": (10, 60),
            "/refresh": (20, 60),
            "/auth/github": (5, 60),
            "/auth/google": (5, 60),
            "/reset-password": (3, 60),
            "default": (100, 60),  # Default for all other endpoints
        }
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Get endpoint path
        path = request.url.path
        
        # Check rate limit
        if not self._check_rate_limit(client_ip, path):
            limit, window = self._get_limit(path)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Please wait {window} seconds and try again.",
                    "retry_after": window,
                    "limit": limit,
                    "window": window
                },
                headers={"Retry-After": str(window)}
            )
        
        # Cleanup old entries periodically
        if time.time() - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_entries()
            self.last_cleanup = time.time()
        
        response = await call_next(request)
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request, handling proxies"""
        # Check X-Forwarded-For header (for proxies/load balancers)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fall back to direct client
        return request.client.host if request.client else "unknown"
    
    def _get_limit(self, path: str) -> Tuple[int, int]:
        """Get rate limit for endpoint"""
        # Check exact match
        if path in self.limits:
            return self.limits[path]
        
        # Check if path starts with any limit key
        for limit_path, (limit, window) in self.limits.items():
            if limit_path != "default" and path.startswith(limit_path):
                return limit, window
        
        # Return default
        return self.limits["default"]
    
    def _check_rate_limit(self, ip: str, path: str) -> bool:
        """Check if request is within rate limit"""
        now = time.time()
        limit, window = self._get_limit(path)
        
        # Initialize IP tracking
        if ip not in self.requests:
            self.requests[ip] = {}
        
        # Initialize endpoint tracking
        if path not in self.requests[ip]:
            self.requests[ip][path] = []
        
        # Remove old requests outside the window
        self.requests[ip][path] = [
            req_time for req_time in self.requests[ip][path]
            if now - req_time < window
        ]
        
        # Check if limit exceeded
        if len(self.requests[ip][path]) >= limit:
            return False
        
        # Add current request
        self.requests[ip][path].append(now)
        return True
    
    def _cleanup_old_entries(self):
        """Remove old entries to prevent memory leak"""
        now = time.time()
        max_window = 300  # 5 minutes
        
        # Clean up IPs
        ips_to_remove = []
        for ip, endpoints in self.requests.items():
            # Clean up endpoints
            endpoints_to_remove = []
            for endpoint, timestamps in endpoints.items():
                # Remove old timestamps
                timestamps[:] = [t for t in timestamps if now - t < max_window]
                
                # Mark empty endpoints for removal
                if not timestamps:
                    endpoints_to_remove.append(endpoint)
            
            # Remove empty endpoints
            for endpoint in endpoints_to_remove:
                del endpoints[endpoint]
            
            # Mark empty IPs for removal
            if not endpoints:
                ips_to_remove.append(ip)
        
        # Remove empty IPs
        for ip in ips_to_remove:
            del self.requests[ip]


class AccountLockoutMiddleware(BaseHTTPMiddleware):
    """
    Account lockout after failed login attempts
    Prevents brute force attacks on user accounts
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Store: {email: {"attempts": count, "locked_until": timestamp}}
        self.failed_attempts: Dict[str, Dict] = {}
        self.max_attempts = 5
        self.lockout_duration = 300  # 5 minutes in seconds
        self.cleanup_interval = 60
        self.last_cleanup = time.time()
    
    async def dispatch(self, request: Request, call_next):
        # Only check on login endpoint
        if request.url.path == "/login" and request.method == "POST":
            # Get email from request body
            try:
                body = await request.body()
                # Re-create request with body for downstream
                request = Request(request.scope, receive=self._make_receive(body))
                
                import json
                data = json.loads(body)
                email = data.get("email", "").lower()
                
                # Check if account is locked
                if self._is_locked(email):
                    locked_until = self.failed_attempts[email]["locked_until"]
                    remaining = int(locked_until - time.time())
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail={
                            "error": "account_locked",
                            "message": f"Account temporarily locked due to too many failed login attempts. Try again in {remaining} seconds or reset your password.",
                            "retry_after": remaining,
                            "action": "reset_password"
                        }
                    )
            except json.JSONDecodeError:
                pass  # Invalid JSON, let it fail downstream
        
        response = await call_next(request)
        
        # Track failed login attempts
        if request.url.path == "/login" and request.method == "POST":
            if response.status_code == 401:  # Unauthorized
                try:
                    body = await request.body()
                    import json
                    data = json.loads(body)
                    email = data.get("email", "").lower()
                    self._record_failed_attempt(email)
                except:
                    pass
            elif response.status_code == 200:  # Success
                try:
                    body = await request.body()
                    import json
                    data = json.loads(body)
                    email = data.get("email", "").lower()
                    self._clear_attempts(email)
                except:
                    pass
        
        # Cleanup old entries
        if time.time() - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_entries()
            self.last_cleanup = time.time()
        
        return response
    
    def _make_receive(self, body: bytes):
        """Create a receive function that returns the body"""
        async def receive():
            return {"type": "http.request", "body": body}
        return receive
    
    def _is_locked(self, email: str) -> bool:
        """Check if account is locked"""
        if email not in self.failed_attempts:
            return False
        
        locked_until = self.failed_attempts[email].get("locked_until", 0)
        if time.time() < locked_until:
            return True
        
        # Lock expired, clear attempts
        self._clear_attempts(email)
        return False
    
    def _record_failed_attempt(self, email: str):
        """Record a failed login attempt"""
        if email not in self.failed_attempts:
            self.failed_attempts[email] = {"attempts": 0, "locked_until": 0}
        
        self.failed_attempts[email]["attempts"] += 1
        
        # Lock account if max attempts reached
        if self.failed_attempts[email]["attempts"] >= self.max_attempts:
            self.failed_attempts[email]["locked_until"] = time.time() + self.lockout_duration
    
    def _clear_attempts(self, email: str):
        """Clear failed attempts for email"""
        if email in self.failed_attempts:
            del self.failed_attempts[email]
    
    def _cleanup_old_entries(self):
        """Remove expired lockouts"""
        now = time.time()
        emails_to_remove = []
        
        for email, data in self.failed_attempts.items():
            locked_until = data.get("locked_until", 0)
            if locked_until > 0 and now > locked_until:
                emails_to_remove.append(email)
        
        for email in emails_to_remove:
            del self.failed_attempts[email]
