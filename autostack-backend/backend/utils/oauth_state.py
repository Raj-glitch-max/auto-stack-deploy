"""
OAuth State Management
Prevents CSRF attacks on OAuth flows
"""
import secrets
import hashlib
import time
from typing import Dict, Optional

class OAuthStateManager:
    """
    Manages OAuth state parameters for CSRF protection
    
    State format: {state_token: {"timestamp": time, "provider": "github"}}
    """
    
    def __init__(self, expiry_seconds: int = 600):
        """
        Initialize state manager
        
        Args:
            expiry_seconds: How long state tokens are valid (default 10 minutes)
        """
        self.states: Dict[str, Dict] = {}
        self.expiry_seconds = expiry_seconds
        self.cleanup_interval = 60
        self.last_cleanup = time.time()
    
    def generate_state(self, provider: str) -> str:
        """
        Generate a new state token
        
        Args:
            provider: OAuth provider name (github, google, etc.)
        
        Returns:
            Secure random state token
        """
        # Generate cryptographically secure random token
        state_token = secrets.token_urlsafe(32)
        
        # Store with metadata
        self.states[state_token] = {
            "timestamp": time.time(),
            "provider": provider
        }
        
        # Cleanup old states periodically
        if time.time() - self.last_cleanup > self.cleanup_interval:
            self._cleanup_expired()
            self.last_cleanup = time.time()
        
        return state_token
    
    def validate_state(self, state_token: str, provider: str) -> bool:
        """
        Validate a state token
        
        Args:
            state_token: State token from OAuth callback
            provider: Expected provider name
        
        Returns:
            True if valid, False otherwise
        """
        # Check if state exists
        if state_token not in self.states:
            return False
        
        state_data = self.states[state_token]
        
        # Check if expired
        if time.time() - state_data["timestamp"] > self.expiry_seconds:
            del self.states[state_token]
            return False
        
        # Check if provider matches
        if state_data["provider"] != provider:
            return False
        
        # State is valid, remove it (one-time use)
        del self.states[state_token]
        return True
    
    def _cleanup_expired(self):
        """Remove expired state tokens"""
        now = time.time()
        expired = [
            token for token, data in self.states.items()
            if now - data["timestamp"] > self.expiry_seconds
        ]
        
        for token in expired:
            del self.states[token]


# Global instance
oauth_state_manager = OAuthStateManager()
