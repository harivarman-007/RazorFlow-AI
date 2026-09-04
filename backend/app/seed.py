from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Invoice

# Empty seed data — ready for fresh user data
SEED_INVOICES = []

async def seed_database(session: AsyncSession):
    """Seed initial records if any are defined."""
    for item in SEED_INVOICES:
        stmt = select(Invoice).where(Invoice.id == item["id"])
        result = await session.execute(stmt)
        inv = result.scalar_one_or_none()
        if inv is None:
            session.add(Invoice(**item))
    await session.commit()
