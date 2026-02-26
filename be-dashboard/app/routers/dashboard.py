from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime
from app.db.database import get_db
from app.models.game import Game
from app.models.sale import Sale
from app.schemas.dashboard import PriceRangeByGenre, PriceRatioItem, PriceGapByGenre

router = APIRouter()

@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    """Ringkasan total data untuk kartu statistik di dashboard."""
    total_games = (await db.execute(select(func.count(Game.id)))).scalar_one()
    total_sales = (await db.execute(select(func.count(Sale.id)))).scalar_one()

    avg_global = (await db.execute(
        select(func.avg(Game.price_cheap)).where(Game.price_cheap != None)
    )).scalar_one()

    avg_our = (await db.execute(
        select(func.avg(Sale.our_price))
    )).scalar_one()

    return {
        "total_games": total_games,
        "total_sales": total_sales,
        "avg_global_price": round(avg_global or 0, 2),
        "avg_our_price": round(avg_our or 0, 2),
    }

# ─── Chart 1: Kisaran harga global per genre ──────────────────────────────────
@router.get("/price-range-by-genre", response_model=list[PriceRangeByGenre])
async def price_range_by_genre(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Pie/Bar chart: kisaran harga global (min, max, avg price_cheap) per genre.
    Menggambarkan genre mana yang memiliki harga tertinggi, terendah, dan rata-rata.
    """
    stmt = (
        select(
            Game.genre,
            func.min(Game.price_cheap).label("min_price"),
            func.max(Game.price_cheap).label("max_price"),
            func.avg(Game.price_cheap).label("avg_price"),
            func.count(Game.id).label("game_count"),
        )
        .where(Game.genre != None)
        .where(Game.price_cheap != None)
    )

    if date_from:
        stmt = stmt.where(Game.released >= date_from)
    if date_to:
        stmt = stmt.where(Game.released <= date_to)

    stmt = stmt.group_by(Game.genre).order_by(func.avg(Game.price_cheap).desc())
    rows = (await db.execute(stmt)).all()

    return [
        PriceRangeByGenre(
            genre=r.genre,
            min_price=round(r.min_price, 2),
            max_price=round(r.max_price, 2),
            avg_price=round(r.avg_price, 2),
            game_count=r.game_count,
        )
        for r in rows
    ]

# ─── Chart 2: Rasio harga toko vs global per game ─────────────────────────────
@router.get("/price-ratio", response_model=list[PriceRatioItem])
async def price_ratio(
    genre: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Column chart: perbandingan our_price vs price_cheap per game.
    ratio > 1 berarti harga toko lebih mahal dari global.
    ratio < 1 berarti harga toko lebih murah dari global.
    """
    stmt = (
        select(Sale, Game)
        .join(Game, Sale.game_id == Game.id)
        .where(Game.price_cheap != None)
    )

    if genre:
        stmt = stmt.where(Game.genre.ilike(f"%{genre}%"))

    rows = (await db.execute(stmt)).all()

    result = []
    for sale, game in rows:
        ratio = round(sale.our_price / game.price_cheap, 4) if game.price_cheap else None
        result.append(PriceRatioItem(
            game_id=game.id,
            game_name=game.name,
            genre=game.genre,
            our_price=sale.our_price,
            price_cheap=game.price_cheap,
            ratio=ratio,
        ))

    # Sort by ratio desc — yang paling mahal relatif ke global di atas
    result.sort(key=lambda x: x.ratio or 0, reverse=True)
    return result

@router.get("/price-gap-by-genre", response_model=list[PriceGapByGenre])
async def price_gap_by_genre(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Bar chart: rata-rata selisih harga toko vs harga global per genre.
    gap positif = harga toko lebih mahal dari global.
    gap negatif = harga toko lebih murah dari global.
    """
    stmt = (
        select(
            Game.genre,
            func.avg(Sale.our_price).label("avg_our_price"),
            func.avg(Game.price_cheap).label("avg_global_price"),
        )
        .join(Sale, Game.id == Sale.game_id)
        .where(Game.genre != None)
        .where(Game.price_cheap != None)
    )

    if date_from:
        stmt = stmt.where(Game.released >= date_from)
    if date_to:
        stmt = stmt.where(Game.released <= date_to)

    stmt = stmt.group_by(Game.genre).order_by(Game.genre)
    rows = (await db.execute(stmt)).all()

    result = []
    for r in rows:
        avg_our = round(r.avg_our_price, 2)
        avg_global = round(r.avg_global_price, 2)
        gap = round(avg_our - avg_global, 2)
        gap_pct = round((gap / avg_global) * 100, 2) if avg_global else None

        result.append(PriceGapByGenre(
            genre=r.genre,
            avg_our_price=avg_our,
            avg_global_price=avg_global,
            avg_gap=gap,
            gap_percent=gap_pct,
        ))

    return result