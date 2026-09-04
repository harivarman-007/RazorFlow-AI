from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import Invoice

class InvoiceAgent:
    """Agent 1: Intelligent Invoice Ingestion & Computation Engine."""

    @staticmethod
    async def generate_invoice_number(session: AsyncSession) -> str:
        """Generate collision-free sequential invoice number INV-2026-00X."""
        stmt = select(func.count(Invoice.id))
        result = await session.execute(stmt)
        count = result.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"INV-{year}-{(count + 1):03d}"

    @staticmethod
    def calculate_totals_and_taxes(items: List[Dict[str, Any]], tax_rate: float = 18.0) -> Dict[str, Any]:
        """Compute subtotal, GST, and grand total."""
        subtotal = 0.0
        processed_items = []

        for item in items:
            rate = float(item.get("rate", 0))
            qty = int(item.get("quantity", 1))
            line_amt = rate * qty
            subtotal += line_amt
            processed_items.append({
                "description": item.get("description", "Service / Line Item"),
                "quantity": qty,
                "rate": rate,
                "amount": line_amt
            })

        gst_amount = round(subtotal * (tax_rate / 100.0), 2)
        total_amount = round(subtotal + gst_amount, 2)

        # Add GST line item if not already present
        processed_items.append({
            "description": f"GST ({int(tax_rate)}%)",
            "quantity": 1,
            "rate": gst_amount,
            "amount": gst_amount
        })

        return {
            "subtotal": subtotal,
            "tax_amount": gst_amount,
            "total_amount": total_amount,
            "items": processed_items
        }

    @staticmethod
    def compute_due_status(due_date_str: str, status: str) -> str:
        """Calculate human-readable due status (e.g. 'Due in 3 days', 'Overdue by 14 days')."""
        if status == "PAID":
            return "Paid via Razorpay"
        try:
            today = date.today()
            due = datetime.strptime(due_date_str, "%Y-%m-%d").date()
            diff = (due - today).days

            if diff < 0:
                return f"Overdue by {abs(diff)} days"
            elif diff == 0:
                return "Due today"
            else:
                return f"Due in {diff} days"
        except Exception:
            return "Pending"
