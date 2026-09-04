from typing import Dict, Any
from app.config import settings
from app.security import generate_order_id, generate_payment_id, compute_razorpay_signature, verify_razorpay_signature

class RazorpayAgent:
    """Agent 4: Cryptographic Razorpay Order, UPI Intent, & Verification Engine."""

    @classmethod
    def create_payment_order(cls, invoice_id: str, amount: float, customer: str) -> Dict[str, Any]:
        """Generate cryptographically unique Razorpay Order and UPI deep link."""
        order_id = generate_order_id()
        amount_paisa = int(amount * 100)

        # Standard NPCI UPI Intent URI format
        vpa = "razorflow@icici"
        pn = "RazorFlow AI"
        upi_intent = (
            f"upi://pay?pa={vpa}&pn={pn}&am={amount:.2f}&cu=INR"
            f"&tn=Invoice {invoice_id}&tr={order_id}"
        )

        # QR payload string
        qr_payload = f"upi://pay?pa={vpa}&pn={pn}&am={amount:.2f}&cu=INR&tr={order_id}&mc=5411"

        return {
            "orderId": order_id,
            "amount": amount,
            "amountPaisa": amount_paisa,
            "currency": "INR",
            "keyId": settings.RAZORPAY_KEY_ID,
            "upiIntent": upi_intent,
            "qrPayload": qr_payload,
            "customer": customer,
            "invoiceId": invoice_id
        }

    @classmethod
    def verify_payment_signature(
        cls,
        order_id: str,
        payment_id: str,
        signature: str
    ) -> bool:
        """
        Validate HMAC-SHA256 signature using timing-safe comparison.
        """
        return verify_razorpay_signature(order_id, payment_id, signature)

    @classmethod
    def simulate_instant_payment(cls, order_id: str, invoice_id: str, amount: float) -> Dict[str, Any]:
        """
        Simulate instant customer payment checkout, generating valid cryptographic signature.
        """
        payment_id = generate_payment_id()
        signature = compute_razorpay_signature(order_id, payment_id)

        return {
            "orderId": order_id,
            "paymentId": payment_id,
            "signature": signature,
            "invoiceId": invoice_id,
            "amount": amount,
            "method": "upi",
            "status": "SUCCESS"
        }
