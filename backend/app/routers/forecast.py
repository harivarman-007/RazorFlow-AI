from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any

from app.database import get_db
from app.models import Invoice
from app.agents.forecast_agent import ForecastAgent

router = APIRouter(prefix="/forecast", tags=["Cash Flow Forecast"])

@router.get("", response_model=Dict[str, Any])
async def get_cash_flow_forecast(db: AsyncSession = Depends(get_db)):
    """
    Agent 6: Predictive Cash Flow Forecast Engine.
    Returns forward projections, value at risk, DSO metrics, and weekly settlement trends.
    """
    stmt = select(Invoice)
    result = await db.execute(stmt)
    invoices = result.scalars().all()
    forecast = ForecastAgent.compute_cash_flow_forecast(list(invoices))
    return forecast
