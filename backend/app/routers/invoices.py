from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from datetime import datetime, timezone

from app.database import get_db
from app.models import Invoice
from app.schemas import InvoiceCreate, InvoiceResponse
from app.agents.invoice_agent import InvoiceAgent
from app.agents.risk_agent import RiskAgent

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("", response_model=List[InvoiceResponse])
async def get_all_invoices(db: AsyncSession = Depends(get_db)):
    """Fetch all invoices from database."""
    stmt = select(Invoice).order_by(desc(Invoice.created_at))
    result = await db.execute(stmt)
    invoices = result.scalars().all()
    return invoices

@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(payload: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    """
    Agent 1 & 2 Workflow:
    1. Agent 1 computes serial invoice number, line items, and GST.
    2. Agent 2 computes machine learning risk score.
    3. Persists to SQLite.
    """
    # 1. Generate sequential number
    invoice_id = await InvoiceAgent.generate_invoice_number(db)

    # 2. Process items and tax
    items_raw = [item.model_dump() for item in payload.items]
    if not items_raw:
        # Generate base item from total amount
        base_rate = round(payload.amount / 1.18, 2)
        items_raw = [{"description": f"Professional Services for {payload.customer}", "quantity": 1, "rate": base_rate, "amount": base_rate}]

    processed = InvoiceAgent.calculate_totals_and_taxes(items_raw)

    # 3. Agent 2: Predict risk
    risk_data = RiskAgent.predict_risk(
        customer=payload.customer,
        industry=payload.industry,
        amount=processed["total_amount"],
        past_delay_days=0
    )

    issue_date = payload.issueDate or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    due_status = InvoiceAgent.compute_due_status(payload.dueDate, "PENDING")

    # 4. Create and persist
    new_invoice = Invoice(
        id=invoice_id,
        customer=payload.customer,
        customer_email=payload.customerEmail or f"billing@{payload.customer.lower().replace(' ', '').replace('.', '')}.com",
        customer_phone=payload.customerPhone or "+919876543210",
        industry=payload.industry,
        amount=processed["total_amount"],
        issue_date=issue_date,
        due_date=payload.dueDate,
        status="PENDING",
        due_status=due_status,
        risk_score=risk_data["score"],
        risk_category=risk_data["category"],
        items=processed["items"]
    )

    db.add(new_invoice)
    await db.commit()
    await db.refresh(new_invoice)
    return new_invoice

@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice_by_id(invoice_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve single invoice record."""
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    result = await db.execute(stmt)
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv
