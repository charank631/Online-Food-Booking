"""
FoodRush FastAPI application entry point.
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_pool, close_pool
from app.seed import run_seed
from app.api import auth, restaurants, menu, orders, payments, dashboard

# ── Logging ───────────────────────────────────────────────────────
os.makedirs(settings.LOG_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            os.path.join(settings.LOG_DIR, "order_processing.log"), mode="a"
        ),
    ],
)
logger = logging.getLogger("foodrush")


# ── Lifespan ──────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[START] FoodRush API starting up...")
    init_pool()
    import migrate
    migrate.run_migrations()
    run_seed()
    logger.info("[READY] Ready to accept requests")
    yield
    close_pool()
    logger.info("🔌  FoodRush API shut down")


# ── App ───────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "End-to-end Online Food Order Processing System — Waffor Take-Home Assessment.\n\n"
        "**Roles:** customer | restaurant_admin | delivery_agent\n\n"
        "**Order flow:** PLACED → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED"
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:80", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────
PREFIX = "/api/v1"
app.include_router(auth.router,        prefix=PREFIX)
app.include_router(restaurants.router, prefix=PREFIX)
app.include_router(menu.router,        prefix=PREFIX)
app.include_router(orders.router,      prefix=PREFIX)
app.include_router(payments.router,    prefix=PREFIX)
app.include_router(dashboard.router,   prefix=PREFIX)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": settings.APP_NAME, "version": settings.APP_VERSION}
