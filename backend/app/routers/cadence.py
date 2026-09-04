from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from app.database import get_db
from app.models import Invoice
from app.agents.collection_agent import CollectionAgent

router = APIRouter(prefix="/cadence", tags=["Cadence Pipeline"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_cadence_pipeline(db: AsyncSession = Depends(get_db)):
    """
    Agent 5: Autonomous Collection Cadence Pipeline.
    Categorizes all active receivables into time-decay stages with AI Smart-Skip recommendations.
    """
    stmt = select(Invoice)
    result = await db.execute(stmt)
    invoices = result.scalars().all()
    pipeline = CollectionAgent.categorize_cadence_pipeline(list(invoices))
    return pipeline
