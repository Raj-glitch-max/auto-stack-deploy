from __future__ import annotations

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import httpx
from passlib.context import CryptContext
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from . import crud, models, schemas
from .db import get_db


router = APIRouter(tags=["auth"])
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


SECRET_KEY = os.getenv("SECRET_KEY", "autostack-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)


# ========================
# Helper functions
# ========================


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {"sub": subject, "exp": expire, "type": "access"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token() -> str:
    """Generate a random refresh token."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> models.User | None:
    user = await crud.get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str | None = Depends(oauth2_scheme)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_data = schemas.TokenPayload(**payload)
        if payload.get("type") != "access":
            raise credentials_exception
    except (JWTError, ValidationError):
        raise credentials_exception

    user = await crud.get_user_by_id(db, token_data.sub)
    if user is None:
        raise credentials_exception

    return user


async def get_current_user_or_api_key(
    db: AsyncSession = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
    x_api_key: str | None = Header(None, alias="X-API-Key"),
) -> models.User:
    """Authenticate user via JWT token or API key."""
    # Try API key first
    if x_api_key:
        key_hash = hash_token(x_api_key)
        api_key = await crud.get_api_key_by_hash(db, key_hash)
        if api_key:
            # Update last used
            await crud.update_api_key_last_used(db, api_key)
            user = await crud.get_user_by_id(db, api_key.user_id)
            if user:
                return user

    # Fall back to JWT token
    return await get_current_user(db, token)


# ========================
# Auth endpoints
# ========================


@router.post("/signup", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await crud.get_user_by_email(db, payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    password_hash = hash_password(payload.password)
    user = await crud.create_user(db, email=payload.email, password_hash=password_hash)
    
    # Create audit log
    await crud.create_audit_log(
        db, user=user, action="signup", resource_type="user", resource_id=str(user.id)
    )
    
    return user


@router.post("/login", response_model=schemas.TokenResponseWithRefresh)
async def login(payload: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Create access token
    access_token = create_access_token(str(user.id))
    
    # Create refresh token
    refresh_token = create_refresh_token()
    refresh_token_hash = hash_token(refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    # Convert to naive datetime for database compatibility
    expires_at_naive = expires_at.replace(tzinfo=None)
    await crud.create_refresh_token(db, user=user, token_hash=refresh_token_hash, expires_at=expires_at_naive)
    
    # Create audit log
    await crud.create_audit_log(db, user=user, action="login", resource_type="auth")
    
    return schemas.TokenResponseWithRefresh(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=schemas.UserResponse)
async def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout():
    """Placeholder endpoint for client-side logout handling."""

    return {"detail": "Logout handled on client"}


@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh_token(
    payload: schemas.TokenRefresh, db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token."""
    try:
        refresh_token_hash = hash_token(payload.refresh_token)
        refresh_token_obj = await crud.get_refresh_token_by_hash(db, refresh_token_hash)
        
        if not refresh_token_obj:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )
        
        # Check if token is expired (handle both naive and timezone-aware datetimes)
        now = datetime.now(timezone.utc)
        expires_at = refresh_token_obj.expires_at
        if expires_at.tzinfo is None:
            # If stored datetime is naive, make it timezone-aware
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < now:
            await crud.delete_refresh_token(db, refresh_token_obj)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired"
            )
        
        # Create new access token
        user = await crud.get_user_by_id(db, refresh_token_obj.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
            )
        
        # Create new access token and return BOTH tokens (use user.id for consistency with login)
        access_token = create_access_token(str(user.id))
        
        # Return the same refresh token (it's still valid)
        return schemas.TokenResponse(
            access_token=access_token,
            refresh_token=payload.refresh_token
        )
    except HTTPException:
        raise
    except Exception as e:
        # Log the actual error for debugging
        print(f"ERROR in /refresh: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Refresh token error: {str(e)}"
        )


# ========================
# GitHub OAuth
# ========================


@router.get("/auth/github")
async def github_login():
    """Redirect to GitHub OAuth"""
    github_client_id = os.getenv("GITHUB_CLIENT_ID")
    github_callback_url = os.getenv("GITHUB_CALLBACK_URL", "http://localhost:8000/auth/github/callback")
    
    print("GitHub OAuth Check:")
    print(f"   Client ID: {github_client_id[:10] if github_client_id else 'NOT SET'}...")
    print(f"   Callback URL: {github_callback_url}")
    
    if not github_client_id:
        print("ERROR: GITHUB_CLIENT_ID not set in environment")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured. Please set GITHUB_CLIENT_ID in environment"
        )
    
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={github_client_id}"
        f"&redirect_uri={github_callback_url}"
        f"&scope=repo,user:email"
    )
    
    print("GitHub OAuth URL generated successfully")
    return {"url": github_auth_url}


@router.get("/auth/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle GitHub OAuth callback with comprehensive error handling"""
    import traceback
    
    github_client_id = os.getenv("GITHUB_CLIENT_ID")
    github_client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    github_callback_url = os.getenv("GITHUB_CALLBACK_URL", "http://localhost:8000/auth/github/callback")
    
    print(f"GitHub OAuth callback initiated with code: {code[:20]}...")
    
    if not github_client_id or not github_client_secret:
        print("ERROR: GitHub OAuth credentials not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured"
        )
    
    try:
        # Exchange code for access token
        # GitHub OAuth API requires form data, not JSON
        print("Exchanging authorization code for access token...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": github_client_id,
                    "client_secret": github_client_secret,
                    "code": code,
                    "redirect_uri": github_callback_url
                },
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            
            if token_response.status_code != 200:
                error_detail = token_response.text
                print(f"Failed to get GitHub access token: {error_detail}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get GitHub access token: {error_detail}"
                )
            
            token_data = token_response.json()
            
            if "error" in token_data:
                error_msg = token_data.get("error_description", token_data.get("error", "Unknown error"))
                print(f"GitHub OAuth error: {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub OAuth error: {error_msg}"
                )
            
            github_token = token_data.get("access_token")
            
            if not github_token:
                print("No access token in GitHub response")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get GitHub access token"
                )
            
            print("Successfully obtained GitHub access token")
        
        # Get user info from GitHub
        print("Fetching user info from GitHub...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            user_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/json"
                }
            )
            
            if user_response.status_code != 200:
                error_detail = user_response.text
                print(f"Failed to get GitHub user info: {error_detail}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get GitHub user info"
                )
            
            github_user = user_response.json()
            print(f"Retrieved GitHub user info for: {github_user.get('login')}")
            
            # Get user's email if not public
            email = github_user.get("email")
            if not email:
                print("Email not in public profile, fetching from emails API...")
                email_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={
                        "Authorization": f"Bearer {github_token}",
                        "Accept": "application/json"
                    }
                )
                
                if email_response.status_code == 200:
                    emails = email_response.json()
                    # Get primary email
                    for e in emails:
                        if e.get("primary") and e.get("verified"):
                            email = e.get("email")
                            break
                    # If no primary, get first verified email
                    if not email:
                        for e in emails:
                            if e.get("verified"):
                                email = e.get("email")
                                break
                    # If still no email, get first email
                    if not email and emails:
                        email = emails[0].get("email")
                    print(f"Retrieved email from GitHub: {email}")
        
        if not email:
            print("Could not get email from GitHub account")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not get email from GitHub account. Please ensure your GitHub account has a verified email address."
            )
        
        # Database transaction with rollback on error
        try:
            # Check if user exists by email
            print(f"Checking if user exists: {email}")
            user = await crud.get_user_by_email(db, email)
            
            if not user:
                # Create new user with GitHub OAuth
                print(f"Creating new user for: {email}")
                user = models.User(
                    email=email,
                    password_hash=hash_password(secrets.token_urlsafe(32)),  # Random password
                    github_token=github_token,
                    github_username=github_user.get("login")
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                print(f"Created new user with ID: {user.id}")
                
                # Create audit log (safe - handles missing email gracefully)
                try:
                    await crud.create_audit_log(
                        db, 
                        user=user, 
                        action="signup_github", 
                        resource_type="user", 
                        resource_id=str(user.id),
                        details={"email": email, "github_username": github_user.get("login")}
                    )
                    print("Audit log created for signup")
                except Exception as audit_err:
                    print(f"Warning: Failed to create audit log: {audit_err}")
                    # Continue even if audit log fails
            else:
                # Update existing user with GitHub info
                print(f"Updating existing user: {email}")
                user.github_token = github_token
                user.github_username = github_user.get("login")
                await db.commit()
                print(f"Updated user with ID: {user.id}")
                
                # Create audit log (safe)
                try:
                    await crud.create_audit_log(
                        db, 
                        user=user, 
                        action="login_github", 
                        resource_type="auth",
                        details={"email": email, "github_username": github_user.get("login")}
                    )
                    print("Audit log created for login")
                except Exception as audit_err:
                    print(f"Warning: Failed to create audit log: {audit_err}")
                    # Continue even if audit log fails
            
            # Create JWT tokens (use user.id for consistency)
            print("Generating JWT tokens...")
            access_token = create_access_token(str(user.id))
            
            # Create refresh token
            refresh_token = create_refresh_token()
            refresh_token_hash = hash_token(refresh_token)
            expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            expires_at_naive = expires_at.replace(tzinfo=None)
            await crud.create_refresh_token(db, user=user, token_hash=refresh_token_hash, expires_at=expires_at_naive)
            print("JWT tokens created successfully")
            
            # Redirect to frontend with tokens
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            redirect_url = f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
            print(f"GitHub OAuth successful. Redirecting to: {frontend_url}/auth/callback")
            
            return RedirectResponse(url=redirect_url)
            
        except Exception as db_err:
            # Rollback on database error
            await db.rollback()
            print(f"Database error during OAuth: {type(db_err).__name__}: {str(db_err)}")
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(db_err)}"
            )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except httpx.HTTPError as e:
        print(f"GitHub API HTTP error: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GitHub API error: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected OAuth error: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth error: {str(e)}"
        )


# ========================
# Google OAuth
# ========================


@router.get("/auth/google")
async def google_login():
    """Redirect to Google OAuth"""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_callback_url = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:8000/auth/google/callback")
    
    print("Google OAuth Check:")
    print(f"   Client ID: {google_client_id[:20] if google_client_id else 'NOT SET'}...")
    print(f"   Callback URL: {google_callback_url}")
    
    if not google_client_id:
        print("WARNING: GOOGLE_CLIENT_ID not set - returning not configured response")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "not_configured", "message": "Google OAuth is not configured on this server. Please use email/password login."}
        )
    
    # Build Google OAuth URL - redirect_uri must match exactly what's configured in Google Cloud Console
    from urllib.parse import urlencode
    params = {
        "client_id": google_client_id,
        "redirect_uri": google_callback_url,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    print("Google OAuth URL generated successfully")
    print(f"   Full URL: {google_auth_url[:100]}...")
    
    return {"url": google_auth_url}


@router.get("/auth/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback with comprehensive error handling"""
    import traceback
    
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    google_callback_url = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:8000/auth/google/callback")
    
    print(f"Google OAuth callback initiated with code: {code[:20]}...")
    print("Google OAuth Callback Configuration:")
    print(f"   Client ID: {google_client_id[:20] if google_client_id else 'NOT SET'}...")
    print(f"   Client Secret: {'SET' if google_client_secret else 'NOT SET'}")
    print(f"   Callback URL: {google_callback_url}")
    
    if not google_client_id or not google_client_secret:
        print("WARNING: Google OAuth credentials not configured")
        missing = []
        if not google_client_id:
            missing.append("GOOGLE_CLIENT_ID")
        if not google_client_secret:
            missing.append("GOOGLE_CLIENT_SECRET")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "not_configured", "message": f"Google OAuth not configured. Missing: {', '.join(missing)}"}
        )
    
    try:
        # Exchange code for access token
        print("Exchanging authorization code for access token...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": google_client_id,
                    "client_secret": google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": google_callback_url
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                error_detail = token_response.text
                print(f"Failed to get Google access token: {error_detail}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get Google access token: {error_detail}"
                )
            
            token_data = token_response.json()
            google_access_token = token_data.get("access_token")
            
            if not google_access_token:
                print("No access token in Google response")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get Google access token"
                )
            
            print("Successfully obtained Google access token")
        
        # Get user info from Google
        print("Fetching user info from Google...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={
                    "Authorization": f"Bearer {google_access_token}"
                }
            )
            
            if user_response.status_code != 200:
                error_detail = user_response.text
                print(f"Failed to get Google user info: {error_detail}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get Google user info"
                )
            
            google_user = user_response.json()
            print(f"Retrieved Google user info for: {google_user.get('email')}")
        
        email = google_user.get("email")
        google_id = google_user.get("id")
        name = google_user.get("name")
        avatar_url = google_user.get("picture")
        email_verified = google_user.get("verified_email", False)
        
        if not email or not google_id:
            print("Missing email or Google ID from user info")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not get email or ID from Google account"
            )
        
        # Database transaction with rollback on error
        try:
            # Check if user exists by email
            print(f"Checking if user exists: {email}")
            user = await crud.get_user_by_email(db, email)
            
            if not user:
                # Create new user with Google OAuth
                print(f"Creating new user for: {email}")
                user = models.User(
                    email=email,
                    password_hash=hash_password(secrets.token_urlsafe(32)),  # Random password
                    google_id=google_id,
                    google_email=email,
                    name=name,
                    avatar_url=avatar_url,
                    email_verified=email_verified
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                print(f"Created new user with ID: {user.id}")
                
                # Create audit log (safe - handles missing email gracefully)
                try:
                    await crud.create_audit_log(
                        db, 
                        user=user, 
                        action="signup_google", 
                        resource_type="user", 
                        resource_id=str(user.id),
                        details={"email": email, "google_id": google_id, "name": name}
                    )
                    print("Audit log created for signup")
                except Exception as audit_err:
                    print(f"Warning: Failed to create audit log: {audit_err}")
                    # Continue even if audit log fails
            else:
                # Update existing user with Google info
                print(f"Updating existing user: {email}")
                user.google_id = google_id
                user.google_email = email
                if name:
                    user.name = name
                if avatar_url:
                    user.avatar_url = avatar_url
                if email_verified:
                    user.email_verified = True
                await db.commit()
                print(f"Updated user with ID: {user.id}")
                
                # Create audit log (safe)
                try:
                    await crud.create_audit_log(
                        db, 
                        user=user, 
                        action="login_google", 
                        resource_type="auth",
                        details={"email": email, "google_id": google_id}
                    )
                    print("Audit log created for login")
                except Exception as audit_err:
                    print(f"Warning: Failed to create audit log: {audit_err}")
                    # Continue even if audit log fails
            
            # Create JWT tokens (use user.id for consistency)
            print("Generating JWT tokens...")
            access_token = create_access_token(str(user.id))
            
            # Create refresh token
            refresh_token = create_refresh_token()
            refresh_token_hash = hash_token(refresh_token)
            expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            expires_at_naive = expires_at.replace(tzinfo=None)
            await crud.create_refresh_token(db, user=user, token_hash=refresh_token_hash, expires_at=expires_at_naive)
            print("JWT tokens created successfully")
            
            # Redirect to frontend with tokens
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            redirect_url = f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
            print(f"Google OAuth successful. Redirecting to: {frontend_url}/auth/callback")
            
            return RedirectResponse(url=redirect_url)
            
        except Exception as db_err:
            # Rollback on database error
            await db.rollback()
            print(f"Database error during OAuth: {type(db_err).__name__}: {str(db_err)}")
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(db_err)}"
            )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except httpx.HTTPError as e:
        print(f"Google API HTTP error: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google API error: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected OAuth error: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth error: {str(e)}"
        )


# ========================
# Password Reset
# ========================


@router.post("/reset-password/request")
async def request_password_reset(
    payload: schemas.UserLogin,  # Only needs email
    db: AsyncSession = Depends(get_db),
):
    """Request password reset - sends reset token (in production, send via email)."""
    user = await crud.get_user_by_email(db, payload.email)
    
    # Always return success to prevent email enumeration
    # In production, send email with reset token
    if user:
        # Generate reset token
        reset_token = create_refresh_token()  # Reuse token generation
        reset_token_hash = hash_token(reset_token)
        
        # Store reset token (in production, use separate table with expiration)
        # For now, we'll use a simple approach - store in user table or separate table
        # For MVP, we'll just return the token (in production, send via email)
        
        # Create audit log
        await crud.create_audit_log(
            db,
            user=user,
            action="password_reset_request",
            resource_type="user",
            resource_id=str(user.id),
            details=f"Password reset requested for {payload.email}",
        )
    
    # Always return success message (security best practice)
    return {
        "detail": "If an account with that email exists, a password reset link has been sent."
    }


@router.post("/reset-password/confirm")
async def confirm_password_reset(
    payload: dict,  # {token: str, new_password: str}
    db: AsyncSession = Depends(get_db),
):
    """Confirm password reset with token and new password."""
    token = payload.get("token")
    new_password = payload.get("new_password")
    
    if not token or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token and new password are required"
        )
    
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    # In production, verify token from database/email
    # For MVP, we'll use a simple approach
    # For now, return error - this needs proper token storage
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Password reset confirmation requires email service integration"
    )


__all__ = [
    "router",
    "get_current_user",
    "get_current_user_or_api_key",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "hash_token",
]
