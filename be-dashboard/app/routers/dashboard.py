from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from typing import Optional
from datetime import date
from app.db.database import get_db
from app.models.game import Game
from app.models.sale import Sale
from app.schemas.dashboard import (
    PriceRangeByGenre,
    PriceRatioItem,
    PriceGapByGenre,
    GamesByDate,
    AvgRatingByGenre,
    SalesByDate,
    MaxPriceByDate,
)

router = APIRouter()

# =============================================================================
# PUBLIC — Data umum game (tidak butuh konteks penjualan toko)
# =============================================================================

# Ringkasan umum (total game, total sales, rata-rata harga global & toko)
@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
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

# Rentang harga (min, max, rata-rata) per genre
@router.get("/price-range-by-genre", response_model=list[PriceRangeByGenre])
async def price_range_by_genre(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
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
        stmt = stmt.where(cast(Game.updated_at, Date) >= date_from)
    if date_to:
        stmt = stmt.where(cast(Game.updated_at, Date) <= date_to)

    stmt = stmt.group_by(Game.genre).order_by(func.avg(Game.price_cheap).desc())
    rows = (await db.execute(stmt)).all()

    return [
        PriceRangeByGenre(
            genre=r.genre,
            min_price=round(r.min_price, 2) if r.min_price is not None else None,
            max_price=round(r.max_price, 2) if r.max_price is not None else None,
            avg_price=round(r.avg_price, 2) if r.avg_price is not None else None,
            game_count=r.game_count,
        )
        for r in rows
    ]

# Rata-rata rating per genre
@router.get("/avg-rating-by-genre", response_model=list[AvgRatingByGenre])
async def avg_rating_by_genre(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Game.genre,
            func.avg(Game.rating).label("avg_rating"),
            func.count(Game.id).label("game_count"),
        )
        .where(Game.genre != None)
        .where(Game.rating != None)
    )

    if date_from:
        stmt = stmt.where(cast(Game.updated_at, Date) >= date_from)
    if date_to:
        stmt = stmt.where(cast(Game.updated_at, Date) <= date_to)

    stmt = stmt.group_by(Game.genre).order_by(func.avg(Game.rating).desc())
    rows = (await db.execute(stmt)).all()

    return [
        AvgRatingByGenre(
            genre=r.genre,
            avg_rating=round(r.avg_rating, 2),
            game_count=r.game_count,
        )
        for r in rows
    ]

# Jumlah game yang diupdate per tanggal (updated_at)
@router.get("/games-by-date", response_model=list[GamesByDate])
async def games_by_date(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    date_col = cast(Game.updated_at, Date).label("date")

    stmt = (
        select(date_col, func.count(Game.id).label("count"))
        .where(Game.updated_at != None)
    )

    if date_from:
        stmt = stmt.where(cast(Game.updated_at, Date) >= date_from)
    if date_to:
        stmt = stmt.where(cast(Game.updated_at, Date) <= date_to)

    stmt = stmt.group_by(date_col).order_by(date_col)
    rows = (await db.execute(stmt)).all()

    return [GamesByDate(date=str(r.date), count=r.count) for r in rows]

# =============================================================================
# STORE — Data penjualan & perbandingan harga toko vs global
# =============================================================================

# Perbandingan harga toko vs global (price ratio) per game, dengan filter genre
@router.get("/price-ratio", response_model=list[PriceRatioItem])
async def price_ratio(
    genre: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
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

    result.sort(key=lambda x: x.ratio or 0, reverse=True)
    return result

# Price gap per genre
@router.get("/price-gap-by-genre", response_model=list[PriceGapByGenre])
async def price_gap_by_genre(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
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
        stmt = stmt.where(cast(Sale.created_at, Date) >= date_from)
    if date_to:
        stmt = stmt.where(cast(Sale.created_at, Date) <= date_to)

    stmt = stmt.group_by(Game.genre).order_by(Game.genre)
    rows = (await db.execute(stmt)).all()

    result = []
    for r in rows:
        avg_our    = round(r.avg_our_price, 2)
        avg_global = round(r.avg_global_price, 2) if r.avg_global_price is not None else None
        gap        = round(avg_our - avg_global, 2) if avg_global is not None else None
        gap_pct    = round((gap / avg_global) * 100, 2) if avg_global else None

        result.append(PriceGapByGenre(
            genre=r.genre,
            avg_our_price=avg_our,
            avg_global_price=avg_global,
            avg_gap=gap,
            gap_percent=gap_pct,
        ))

    return result

# Jumlah penjualan per tanggal (created_at)
@router.get("/sales-by-date", response_model=list[SalesByDate])
async def sales_by_date(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    date_col = cast(Sale.created_at, Date).label("date")

    stmt = (
        select(date_col, func.count(Sale.id).label("count"))
        .where(Sale.created_at != None)
    )

    if date_from:
        stmt = stmt.where(cast(Sale.created_at, Date) >= date_from)
    if date_to:
        stmt = stmt.where(cast(Sale.created_at, Date) <= date_to)

    stmt = stmt.group_by(date_col).order_by(date_col)
    rows = (await db.execute(stmt)).all()

    return [SalesByDate(date=str(r.date), count=r.count) for r in rows]

# Harga maksimum per tanggal (created_at)
@router.get("/max-price-by-date", response_model=list[MaxPriceByDate])
async def max_price_by_date(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    date_col = cast(Sale.created_at, Date).label("date")

    stmt = (
        select(date_col, func.max(Sale.our_price).label("max_price"))
        .where(Sale.created_at != None)
        .where(Sale.our_price != None)
    )

    if date_from:
        stmt = stmt.where(cast(Sale.created_at, Date) >= date_from)
    if date_to:
        stmt = stmt.where(cast(Sale.created_at, Date) <= date_to)

    stmt = stmt.group_by(date_col).order_by(date_col)
    rows = (await db.execute(stmt)).all()

    return [MaxPriceByDate(date=str(r.date), max_price=round(r.max_price, 2)) for r in rows]