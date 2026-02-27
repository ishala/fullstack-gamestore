from fastapi import APIRouter
from app.routers import (
    dashboard,
    games,
    sales,
    sync
)

api_router = APIRouter()

api_router.include_router(games.router, prefix="/games", tags=["Games"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(sync.router, prefix="/sync", tags=["Sync"])