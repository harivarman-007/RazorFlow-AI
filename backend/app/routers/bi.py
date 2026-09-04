from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Invoice
from app.schemas import BIQueryRequest, BIQueryResponse
from app.agents.bi_agent import BIAgent

router = APIRouter(prefix="/bi", tags=["BI Copilot"])

@router.post("/query", response_model=BIQueryResponse)
async def query_bi_copilot(payload: BIQueryRequest, db: AsyncSession = Depends(get_db)):
    """
    Agent 7: Natural Language Business Intelligence & Ledger Context Engine.
    Executes analytical queries directly over live database state without hallucinating numbers.
    """
    stmt = select(Invoice)
    result = await db.execute(stmt)
    invoices = result.scalars().all()
    answer = BIAgent.query_ledger(payload.query, list(invoices))
    return BIQueryResponse(**answer)
