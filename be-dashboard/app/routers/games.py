from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.db.database import get_db
from app.models.sync_log import SyncLog
from app.schemas.game import GameCreate, GameUpdate, GameInDB, PaginatedGame
from app.schemas.sync_log import SyncLogInDB
from app.services.sync_service import sync_games
from app.crud.games import (
    get_all,
    get_by_id,
    get_by_slug,
    create,
    update,
    delete,
)

router = APIRouter()


# ─── READ: list ───────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedGame)
async def list_games(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    genre: Optional[str] = None,
    sort_by: str = Query("updated_at", enum=["name", "released", "rating", "updated_at"]),
    sort_dir: str = Query("desc", enum=["asc", "desc"]),
    db: AsyncSession = Depends(get_db),
):
    total, games = await get_all(db, page, page_size, search, genre, sort_by, sort_dir)
    return PaginatedGame(total=total, page=page, page_size=page_size, data=games)


# ─── SYNC: fetch dari RAWG + CheapShark → simpan ke DB ───────────────────────

@router.get("/sync", response_model=SyncLogInDB)
async def trigger_sync(
    limit: int = Query(40, ge=1, le=40, description="Jumlah game yang di-fetch dari RAWG"),
    db: AsyncSession = Depends(get_db),
):
    log = await sync_games(db, limit=limit)
    if log.status == "error":
        raise HTTPException(status_code=500, detail=log.message)
    return log


# ─── READ: last sync ──────────────────────────────────────────────────────────

@router.get("/last-sync", response_model=Optional[SyncLogInDB])
async def get_last_sync(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(SyncLog)
        .where(SyncLog.source == "rawg+cheapshark")  # fix: sesuai source di sync_service
        .order_by(SyncLog.synced_at.desc())
        .limit(1)
    )
    log = (await db.execute(stmt)).scalar_one_or_none()
    return log


# ─── READ: detail ─────────────────────────────────────────────────────────────

@router.get("/{game_id}", response_model=GameInDB)
async def get_game(game_id: int, db: AsyncSession = Depends(get_db)):
    game = await get_by_id(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


# ─── CREATE ───────────────────────────────────────────────────────────────────

@router.post("", response_model=GameInDB, status_code=201)
async def create_game(payload: GameCreate, db: AsyncSession = Depends(get_db)):
    if await get_by_id(db, payload.id):
        raise HTTPException(status_code=409, detail=f"Game with ID {payload.id} already exists")
    if await get_by_slug(db, payload.slug):
        raise HTTPException(status_code=409, detail=f"Game with slug '{payload.slug}' already exists")
    return await create(db, payload)


# ─── UPDATE ───────────────────────────────────────────────────────────────────

@router.patch("/{game_id}", response_model=GameInDB)
async def update_game(game_id: int, payload: GameUpdate, db: AsyncSession = Depends(get_db)):
    game = await get_by_id(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return await update(db, game, payload)


# ─── DELETE ───────────────────────────────────────────────────────────────────

@router.delete("/{game_id}", status_code=204)
async def delete_game(game_id: int, db: AsyncSession = Depends(get_db)):
    game = await get_by_id(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    await delete(db, game)