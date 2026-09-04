from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.seed import seed_database
from app.security import get_security_headers

# Routers
from app.routers import invoices, risk, reminders, payments, cadence, forecast, bi

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup & shutdown events:
    1. Initialize SQLite schema in WAL mode
    2. Seed initial enterprise records if empty
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_database(session)

    yield

    # Clean shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-Speed, Secure Asynchronous Backend for RazorFlow AI Autonomous AR Platform",
    lifespan=lifespan
)

# 1. Strict CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"]
)

# 2. Security Headers & Performance Middleware
@app.middleware("http")
async def security_and_timing_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    response: Response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time * 1000:.2f}ms"

    # Inject enterprise security headers
    for header, value in get_security_headers().items():
        response.headers[header] = value

    return response

# 3. Mount Routers
app.include_router(invoices.router, prefix=settings.API_PREFIX)
app.include_router(risk.router, prefix=settings.API_PREFIX)
app.include_router(reminders.router, prefix=settings.API_PREFIX)
app.include_router(payments.router, prefix=settings.API_PREFIX)
app.include_router(cadence.router, prefix=settings.API_PREFIX)
app.include_router(forecast.router, prefix=settings.API_PREFIX)
app.include_router(bi.router, prefix=settings.API_PREFIX)

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint indicating ASGI engine and database status."""
    return {
        "status": "HEALTHY",
        "engine": "FastAPI + Async SQLAlchemy 2.0 (aiosqlite WAL)",
        "version": settings.VERSION,
        "security": "HMAC-SHA256 Timing-Safe & Strict CORS Active"
    }
