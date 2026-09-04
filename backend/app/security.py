import hmac
import hashlib
import secrets
from typing import Dict
from app.config import settings

def generate_secure_token(length: int = 16) -> str:
    """Generate cryptographically secure URL-safe token."""
    return secrets.token_urlsafe(length)

def generate_order_id() -> str:
    """Generate cryptographic simulated Razorpay Order ID."""
    hex_suffix = secrets.token_hex(7)
    return f"order_{hex_suffix}"

def generate_payment_id() -> str:
    """Generate cryptographic simulated Razorpay Payment ID."""
    hex_suffix = secrets.token_hex(7)
    return f"pay_{hex_suffix}"

def compute_razorpay_signature(order_id: str, payment_id: str, secret: str = settings.RAZORPAY_KEY_SECRET) -> str:
    """Compute HMAC-SHA256 signature for Razorpay verification."""
    message = f"{order_id}|{payment_id}".encode("utf-8")
    key = secret.encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()

def verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str = settings.RAZORPAY_KEY_SECRET) -> bool:
    """
    Timing-attack-safe verification of Razorpay payment signature.
    Uses hmac.compare_digest to eliminate timing side-channel attacks.
    """
    if not order_id or not payment_id or not signature:
        return False
    expected = compute_razorpay_signature(order_id, payment_id, secret)
    return hmac.compare_digest(expected, signature)

def get_security_headers() -> Dict[str, str]:
    """Standard enterprise security headers."""
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
    }
