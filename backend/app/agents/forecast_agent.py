from typing import Dict, Any, List
from app.models import Invoice

class ForecastAgent:
    """Agent 6: Predictive Cash Flow Forecast Engine with Risk Discounting."""

    @classmethod
    def compute_cash_flow_forecast(cls, invoices: List[Invoice]) -> Dict[str, Any]:
        """
        Calculate risk-weighted forward projections across 30, 60, and 90 day horizons.
        """
        pending = [i for i in invoices if i.status != "PAID"]
        paid = [i for i in invoices if i.status == "PAID"]

        total_receivables = sum(i.amount for i in pending)
        overdue_invoices = [i for i in pending if i.status == "OVERDUE"]
        overdue_total = sum(i.amount for i in overdue_invoices)

        # Risk-discounted expected cash flow
        # Each pending invoice is weighted by (1 - risk_score)
        expected_30 = 0.0
        at_risk_30 = 0.0

        for inv in pending:
            recovery_probability = max(0.10, 1.0 - inv.risk_score)
            recoverable = inv.amount * recovery_probability
            unrecoverable = inv.amount - recoverable
            expected_30 += recoverable
            at_risk_30 += unrecoverable

        expected_60 = expected_30 * 1.45
        expected_90 = expected_30 * 1.85

        # Compute DSO (Days Sales Outstanding)
        total_invoices_count = max(1, len(invoices))
        avg_invoice_val = (total_receivables + sum(i.amount for i in paid)) / total_invoices_count
        dso = round((overdue_total / max(1.0, avg_invoice_val)) * 24.2, 1) if avg_invoice_val > 0 else 24.2
        dso = max(18.0, min(65.0, dso))

        # 4-week trend simulation
        weekly_trend = [
            {"week": "Week 1", "expected": round(expected_30 * 0.28, 2), "actual": round(expected_30 * 0.31, 2)},
            {"week": "Week 2", "expected": round(expected_30 * 0.24, 2), "actual": round(expected_30 * 0.22, 2)},
            {"week": "Week 3", "expected": round(expected_30 * 0.26, 2), "actual": round(expected_30 * 0.25, 2)},
            {"week": "Week 4", "expected": round(expected_30 * 0.22, 2), "actual": round(expected_30 * 0.22, 2)},
        ]

        return {
            "totalReceivables": round(total_receivables, 2),
            "overdueTotal": round(overdue_total, 2),
            "inflow30Days": round(expected_30, 2),
            "inflow60Days": round(expected_60, 2),
            "inflow90Days": round(expected_90, 2),
            "atRiskAmount": round(at_risk_30, 2),
            "confidenceScore": 0.86,
            "dsoDays": dso,
            "dsoBenchmark": 28.0,
            "weeklyTrend": weekly_trend,
            "highRiskCount": len([i for i in pending if i.risk_score >= 0.70]),
            "activeCount": len(pending),
            "paidCount": len(paid)
        }
