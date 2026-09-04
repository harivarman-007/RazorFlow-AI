from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.models import Invoice, PaymentTransaction
from app.schemas import CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest, VerifyPaymentResponse
from app.agents.razorpay_agent import RazorpayAgent

router = APIRouter(prefix="/payments", tags=["Razorpay Engine"])

@router.post("/create-order", response_model=CreateOrderResponse)
async def create_payment_order(payload: CreateOrderRequest, db: AsyncSession = Depends(get_db)):
    """
    Agent 4: Create Cryptographic Razorpay Order with UPI Intent.
    """
    order_data = RazorpayAgent.create_payment_order(
        invoice_id=payload.invoiceId,
        amount=payload.amount,
        customer=payload.customerName
    )

    # Record pending transaction
    tx = PaymentTransaction(
        id=str(uuid.uuid4()),
        invoice_id=payload.invoiceId,
        order_id=order_data["orderId"],
        amount=payload.amount,
        currency=order_data["currency"],
        status="CREATED",
        method="upi",
        verified=False
    )
    db.add(tx)
    await db.commit()

    return CreateOrderResponse(
        orderId=order_data["orderId"],
        amount=order_data["amount"],
        currency=order_data["currency"],
        keyId=order_data["keyId"],
        upiIntent=order_data["upiIntent"],
        qrPayload=order_data["qrPayload"]
    )

@router.post("/simulate-checkout")
async def simulate_instant_checkout(payload: CreateOrderRequest):
    """
    Generate instant simulated customer payment with valid HMAC-SHA256 signature.
    """
    order_data = RazorpayAgent.create_payment_order(
        invoice_id=payload.invoiceId,
        amount=payload.amount,
        customer=payload.customerName
    )
    simulated = RazorpayAgent.simulate_instant_payment(
        order_id=order_data["orderId"],
        invoice_id=payload.invoiceId,
        amount=payload.amount
    )
    return simulated

@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(payload: VerifyPaymentRequest, db: AsyncSession = Depends(get_db)):
    """
    Cryptographically verify payment signature via HMAC-SHA256 timing-attack-safe comparison.
    On valid verification, marks Invoice as PAID in SQLite and commits transaction record.
    """
    is_valid = RazorpayAgent.verify_payment_signature(
        order_id=payload.orderId,
        payment_id=payload.paymentId,
        signature=payload.signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cryptographic signature verification failed. Potential tampering or replay attack detected."
        )

    # 1. Update invoice status
    stmt = select(Invoice).where(Invoice.id == payload.invoiceId)
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()

    now_utc = datetime.now(timezone.utc)
    if invoice:
        invoice.status = "PAID"
        invoice.due_status = "Paid just now via Razorpay"
        invoice.payment_method = "Razorpay UPI"
        invoice.paid_at = now_utc

    # 2. Record / update payment transaction
    tx_stmt = select(PaymentTransaction).where(PaymentTransaction.order_id == payload.orderId)
    tx_res = await db.execute(tx_stmt)
    tx = tx_res.scalar_one_or_none()

    if tx:
        tx.payment_id = payload.paymentId
        tx.signature = payload.signature
        tx.status = "SUCCESS"
        tx.verified = True
    else:
        tx = PaymentTransaction(
            id=str(uuid.uuid4()),
            invoice_id=payload.invoiceId,
            order_id=payload.orderId,
            payment_id=payload.paymentId,
            signature=payload.signature,
            amount=invoice.amount if invoice else 0.0,
            currency="INR",
            status="SUCCESS",
            method="upi",
            verified=True
        )
        db.add(tx)

    await db.commit()

    return VerifyPaymentResponse(
        success=True,
        invoiceId=payload.invoiceId,
        paymentId=payload.paymentId,
        status="PAID",
        message="Payment cryptographically verified and settled into merchant ledger.",
        paidAt=now_utc.strftime("%Y-%m-%d %H:%M:%S UTC")
    )
