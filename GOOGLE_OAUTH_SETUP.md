# Google OAuth Setup Guide

## 🚀 Ready to Implement Google Authentication

The UI is fully prepared for Google OAuth. Here's what needs to be done on the backend:

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8000/auth/google`

### 2. Backend Implementation
Add to `/autostack-backend/backend/auth.py`:

```python
from google.auth.transport import requests
from google.oauth2 import id_token
import os

# Add environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@app.post("/auth/google")
async def google_auth(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        token = await request.json()
        idinfo = id_token.verify_oauth2_token(
            token["credential"], 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        email = idinfo["email"]
        name = idinfo["name"]
        
        # Check if user exists
        user = await crud.get_user_by_email(db, email=email)
        if not user:
            user = await crud.create_user(db, email=email, name=name)
        
        # Create tokens
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token()
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Google token")
```

### 3. Frontend Integration
Add Google OAuth script to layout:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

The buttons are already styled and ready - just need to connect to backend!

### 4. Environment Variables
Add to `.env`:
```
GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

The UI is production-ready and waiting for the OAuth implementation! 🎉
