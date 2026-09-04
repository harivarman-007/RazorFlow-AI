from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, JSON, Index
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(64), primary_key=True, index=True)
    customer = Column(String(255), nullable=False, index=True)
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(64), nullable=True)
    industry = Column(String(128), nullable=False, default="Technology")
    amount = Column(Float, nullable=False, default=0.0)
    issue_date = Column(String(32), nullable=False)
    due_date = Column(String(32), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="PENDING", index=True)
    due_status = Column(String(128), nullable=False, default="Due in 7 days")
    risk_score = Column(Float, nullable=False, default=0.15)
    risk_category = Column(String(32), nullable=False, default="LOW")
    items = Column(JSON, nullable=False, default=list)
    payment_method = Column(String(64), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    __table_args__ = (
        Index("idx_invoices_status_due", "status", "due_date"),
    )

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String(64), primary_key=True, index=True)
    invoice_id = Column(String(64), nullable=False, index=True)
    order_id = Column(String(128), nullable=False, index=True)
    payment_id = Column(String(128), nullable=True, index=True)
    signature = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(16), nullable=False, default="INR")
    status = Column(String(32), nullable=False, default="CREATED")
    method = Column(String(64), nullable=False, default="upi")
    verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=utc_now)

class ReminderLog(Base):
    __tablename__ = "reminder_logs"

    id = Column(String(64), primary_key=True, index=True)
    invoice_id = Column(String(64), nullable=False, index=True)
    customer = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(64), nullable=True)
    tone = Column(String(32), nullable=False)
    channels = Column(JSON, nullable=False, default=list)
    message_body = Column(Text, nullable=False)
    payment_link = Column(String(512), nullable=True)
    dispatched_at = Column(DateTime, default=utc_now)

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(64), primary_key=True, index=True)
    invoice_id = Column(String(64), nullable=False, index=True)
    customer = Column(String(255), nullable=False)
    score = Column(Float, nullable=False)
    category = Column(String(32), nullable=False)
    factors = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=utc_now)
