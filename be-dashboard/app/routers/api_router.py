from fastapi import APIRouter
from app.routers import (
    dashboard,
    games,
    sales
)

api_router = APIRouter()

api_router.include_router(games.router, prefix="/games", tags=["Games"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])