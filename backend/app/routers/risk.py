from fastapi import APIRouter
from app.schemas import RiskPredictionRequest, RiskPredictionResponse
from app.agents.risk_agent import RiskAgent

router = APIRouter(prefix="/risk", tags=["Risk Engine"])

@router.post("/predict", response_model=RiskPredictionResponse)
async def predict_invoice_risk(payload: RiskPredictionRequest):
    """
    Agent 2: ML Payment Delay Risk Prediction.
    Evaluates customer profile, industry volatility, ticket size, and historical delay drift.
    """
    result = RiskAgent.predict_risk(
        customer=payload.customer,
        industry=payload.industry,
        amount=payload.amount,
        past_delay_days=payload.pastDelayDays or 0
    )
    return RiskPredictionResponse(**result)
