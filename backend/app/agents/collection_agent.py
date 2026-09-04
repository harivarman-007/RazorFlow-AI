from typing import Dict, Any, List
from datetime import datetime, date
from app.models import Invoice

class CollectionAgent:
    """Agent 5: Autonomous Collection Cadence Pipeline & AI Smart-Skip Engine."""

    CADENCE_STAGES = [
        {"id": "t_minus_3", "label": "Due -3 Days", "days": "-3d", "action": "Friendly Pre-Notice", "channel": "Email"},
        {"id": "due_date", "label": "Due Date", "days": "0d", "action": "Instant Payment Link", "channel": "WhatsApp"},
        {"id": "t_plus_3", "label": "Overdue +3 Days", "days": "+3d", "action": "Tone-Shift Follow-up", "channel": "WhatsApp"},
        {"id": "t_plus_7", "label": "Overdue +7 Days", "days": "+7d", "action": "Urgent CFO Alert", "channel": "SMS + Call"},
        {"id": "t_plus_14", "label": "Overdue +14 Days", "days": "+14d", "action": "Legal Demand Notice", "channel": "Courier + Legal"}
    ]

    @classmethod
    def evaluate_smart_skip(cls, invoice: Invoice) -> Dict[str, Any]:
        """
        AI Smart-Skip Decision:
        Decide whether to skip, delay, or fast-track collection touchpoints.
        """
        if invoice.status == "PAID":
            return {"shouldSkip": True, "reason": "Already settled in full via Razorpay"}

        if invoice.risk_score <= 0.15 and invoice.amount > 100000:
            return {
                "shouldSkip": True,
                "badge": "Smart-Skipped",
                "reason": "VIP Low-Risk client — auto-suppressed to preserve relationship"
            }

        if invoice.risk_score >= 0.70:
            return {
                "shouldSkip": False,
                "badge": "Fast-Track",
                "reason": "Elevated delay risk — accelerated cadence recommended"
            }

        return {
            "shouldSkip": False,
            "badge": "Active Cadence",
            "reason": "Standard automated cadence pipeline active"
        }

    @classmethod
    def categorize_cadence_pipeline(cls, invoices: List[Invoice]) -> List[Dict[str, Any]]:
        """Categorize live invoices across the 5 cadence stages with Smart-Skip annotations."""
        today = date.today()
        buckets: Dict[str, List[Dict[str, Any]]] = {
            s["id"]: [] for s in cls.CADENCE_STAGES
        }

        for inv in invoices:
            if inv.status == "PAID":
                continue

            try:
                due = datetime.strptime(inv.due_date, "%Y-%m-%d").date()
                diff = (due - today).days
            except Exception:
                diff = 0

            skip_eval = cls.evaluate_smart_skip(inv)
            inv_dict = {
                "id": inv.id,
                "customer": inv.customer,
                "industry": inv.industry,
                "amount": inv.amount,
                "dueDate": inv.due_date,
                "riskScore": inv.risk_score,
                "riskCategory": inv.risk_category,
                "status": inv.status,
                "smartSkip": skip_eval
            }

            if diff > 1:
                buckets["t_minus_3"].append(inv_dict)
            elif diff >= 0:
                buckets["due_date"].append(inv_dict)
            elif diff >= -3:
                buckets["t_plus_3"].append(inv_dict)
            elif diff >= -7:
                buckets["t_plus_7"].append(inv_dict)
            else:
                buckets["t_plus_14"].append(inv_dict)

        result = []
        for s in cls.CADENCE_STAGES:
            stage_copy = dict(s)
            stage_copy["invoices"] = buckets[s["id"]]
            stage_copy["count"] = len(buckets[s["id"]])
            stage_copy["totalAmount"] = sum(i["amount"] for i in buckets[s["id"]])
            result.append(stage_copy)

        return result
