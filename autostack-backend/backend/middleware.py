# middleware.py
from __future__ import annotations

import time
from collections import defaultdict
from typing import Callable

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


# In-memory rate limiter (for production, use Redis)
_rate_limit_store: dict[str, list[float]] = defaultdict(list)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for sensitive endpoints."""

    def __init__(self, app, calls: int = 5, period: float = 60.0):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.protected_paths = ["/login", "/signup"]

    async def dispatch(self, request: Request, call_next: Callable):
        # Check if path needs rate limiting
        if any(request.url.path.startswith(path) for path in self.protected_paths):
            client_ip = request.client.host if request.client else "unknown"
            key = f"{client_ip}:{request.url.path}"

            # Clean old entries
            now = time.time()
            _rate_limit_store[key] = [
                timestamp
                for timestamp in _rate_limit_store[key]
                if now - timestamp < self.period
            ]

            # Check rate limit
            if len(_rate_limit_store[key]) >= self.calls:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": f"Rate limit exceeded. Maximum {self.calls} requests per {self.period} seconds."
                    },
                )

            # Record this request
            _rate_limit_store[key].append(now)

        response = await call_next(request)
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Unified error handling middleware."""

    async def dispatch(self, request: Request, call_next: Callable):
        try:
            response = await call_next(request)
            return response
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail, "status_code": e.status_code},
            )
        except Exception as e:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": "Internal server error",
                    "status_code": 500,
                    "error": str(e) if __debug__ else None,
                },
            )


