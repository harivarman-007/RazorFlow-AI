from typing import Dict, Any, List
import math

INDUSTRY_RISK_FACTORS = {
    "Logistics & Freight": 0.28,
    "Logistics": 0.28,
    "E-Commerce": 0.24,
    "Retail": 0.22,
    "Manufacturing": 0.16,
    "Construction": 0.25,
    "SaaS / Cloud": 0.08,
    "Technology": 0.07,
    "Healthcare": 0.05,
    "Fintech": 0.04
}

class RiskAgent:
    """Agent 2: ML & Statistical Payment Delay Risk Prediction Engine."""

    @classmethod
    def predict_risk(
        cls,
        customer: str,
        industry: str,
        amount: float,
        past_delay_days: int = 0
    ) -> Dict[str, Any]:
        """
        Compute late payment probability (0.0 - 1.0), risk tier, and explainable feature drivers.
        """
        base_score = 0.08
        factors: List[str] = []

        # 1. Industry Macro Factor
        ind_factor = INDUSTRY_RISK_FACTORS.get(industry, 0.12)
        base_score += ind_factor
        if ind_factor >= 0.20:
            factors.append(f"Macro friction in {industry} (+{int(ind_factor*100)}% risk)")
        elif ind_factor <= 0.06:
            factors.append(f"Favorable industry settlement velocity in {industry}")

        # 2. Historical Delay Drift
        if past_delay_days > 0:
            delay_impact = min(0.45, past_delay_days * 0.025)
            base_score += delay_impact
            factors.append(f"Past delay history of {past_delay_days} days (+{int(delay_impact*100)}% risk)")
        else:
            factors.append("Clean historical repayment tenure")

        # 3. Amount Scale Friction (Approval Tier)
        if amount > 200000:
            amt_factor = min(0.20, math.log10(amount / 100000) * 0.15)
            base_score += amt_factor
            factors.append(f"Large invoice value (>₹2L) requires multi-tier CFO approval (+{int(amt_factor*100)}% risk)")
        elif amount < 50000:
            base_score -= 0.03
            factors.append("Low ticket size fast-tracks instant petty cash settlement")

        # Clamp between 0.02 and 0.98
        final_score = max(0.02, min(0.98, round(base_score, 2)))

        # Categorize
        if final_score >= 0.70:
            category = "HIGH"
        elif final_score >= 0.35:
            category = "MEDIUM"
        else:
            category = "LOW"

        confidence = round(0.85 + (0.10 * (1.0 - abs(final_score - 0.5))), 2)

        return {
            "score": final_score,
            "category": category,
            "confidence": confidence,
            "factors": factors
        }
