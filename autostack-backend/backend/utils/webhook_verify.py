"""
Webhook Signature Verification
Verifies GitHub webhook signatures to prevent unauthorized triggers
"""
import hmac
import hashlib
from typing import Optional

def verify_github_signature(
    payload: bytes,
    signature_header: str,
    secret: str
) -> bool:
    """
    Verify GitHub webhook signature
    
    Args:
        payload: Raw request body bytes
        signature_header: Value of X-Hub-Signature-256 header
        secret: Webhook secret configured in GitHub
    
    Returns:
        True if signature is valid, False otherwise
    
    Example:
        signature = request.headers.get("X-Hub-Signature-256")
        body = await request.body()
        if not verify_github_signature(body, signature, WEBHOOK_SECRET):
            raise HTTPException(401, "Invalid signature")
    """
    if not signature_header:
        return False
    
    # GitHub signature format: "sha256=<hex_digest>"
    if not signature_header.startswith("sha256="):
        return False
    
    # Extract the hex digest
    expected_signature = signature_header[7:]  # Remove "sha256=" prefix
    
    # Compute HMAC-SHA256
    mac = hmac.new(
        secret.encode('utf-8'),
        msg=payload,
        digestmod=hashlib.sha256
    )
    computed_signature = mac.hexdigest()
    
    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(computed_signature, expected_signature)


def verify_gitlab_signature(
    payload: bytes,
    token_header: str,
    secret: str
) -> bool:
    """
    Verify GitLab webhook token
    
    Args:
        payload: Raw request body bytes (not used for GitLab)
        token_header: Value of X-Gitlab-Token header
        secret: Webhook secret configured in GitLab
    
    Returns:
        True if token is valid, False otherwise
    """
    if not token_header:
        return False
    
    # GitLab uses simple token comparison
    return hmac.compare_digest(token_header, secret)


def generate_webhook_secret() -> str:
    """
    Generate a secure webhook secret
    
    Returns:
        Cryptographically secure random string
    """
    import secrets
    return secrets.token_urlsafe(32)
