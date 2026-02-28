from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from typing import Optional
from datetime import datetime, date
from app.db.database import get_db
from app.models.game import Game
from app.models.sale import Sale
from app.schemas.dashboard import (PriceRangeByGenre, PriceRatioItem, PriceGapByGenre, GamesByDate,
    AvgRatingByGenre,
    SalesByDate,
    MaxPriceByDate,)

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
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
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
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
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

@router.get("/games-by-date", response_model=list[GamesByDate])
async def games_by_date(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Column chart (Data Public):
    COUNT game dikelompokkan per tanggal updated_at dari RAWG.
    Merepresentasikan kapan data game masuk/diperbarui di sistem kita.

    Menggunakan updated_at (bukan released) karena:
    - released bisa bertahun-tahun lalu, tidak relevan untuk filter 1 bulan terakhir.
    - updated_at mencerminkan aktivitas fetch data aktual ke database kita.
    """
    # Cast ke Date agar jam diabaikan, hanya tanggal yang di-group
    date_col = cast(Game.updated_at, Date).label("date")

    stmt = (
        select(date_col, func.count(Game.id).label("count"))
        .where(Game.updated_at != None)
    )

    if date_from:
        stmt = stmt.where(Game.updated_at >= date_from)
    if date_to:
        stmt = stmt.where(Game.updated_at <= date_to)

    stmt = stmt.group_by(date_col).order_by(date_col)
    rows = (await db.execute(stmt)).all()

    return [
        GamesByDate(date=str(r.date), count=r.count)
        for r in rows
    ]

@router.get("/avg-rating-by-genre", response_model=list[AvgRatingByGenre])
async def avg_rating_by_genre(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Analitik tambahan (Data Public):
    Rata-rata rating RAWG (skala 0–5) dikelompokkan per genre.
    """
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
        stmt = stmt.where(Game.updated_at >= date_from)
    if date_to:
        stmt = stmt.where(Game.updated_at <= date_to)

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

@router.get("/sales-by-date", response_model=list[SalesByDate])
async def sales_by_date(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Column chart 1 (Data Sales):
    COUNT sales dikelompokkan per tanggal created_at.
    Menunjukkan berapa game ditambahkan ke toko per hari.
    """
    date_col = cast(Sale.created_at, Date).label("date")

    stmt = (
        select(date_col, func.count(Sale.id).label("count"))
        .where(Sale.created_at != None)
    )

    if date_from:
        stmt = stmt.where(Sale.created_at >= date_from)
    if date_to:
        stmt = stmt.where(Sale.created_at <= date_to)

    stmt = stmt.group_by(date_col).order_by(date_col)
    rows = (await db.execute(stmt)).all()

    return [
        SalesByDate(date=str(r.date), count=r.count)
        for r in rows
    ]

@router.get("/max-price-by-date", response_model=list[MaxPriceByDate])
async def max_price_by_date(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Column/Line chart 2 (Data Sales):
    MAX our_price dikelompokkan per tanggal created_at.

    Contoh: tgl 27 Feb ada 2 game ($12 & $3) → ditampilkan $12.
    Berguna untuk melihat fluktuasi harga tertinggi yang masuk ke toko per hari.
    """
    date_col = cast(Sale.created_at, Date).label("date")

    stmt = (
        select(date_col, func.max(Sale.our_price).label("max_price"))
        .where(Sale.created_at != None)
        .where(Sale.our_price != None)
    )

    if date_from:
        stmt = stmt.where(Sale.created_at >= date_from)
    if date_to:
        stmt = stmt.where(Sale.created_at <= date_to)

    stmt = stmt.group_by(date_col).order_by(date_col)
    rows = (await db.execute(stmt)).all()

    return [
        MaxPriceByDate(date=str(r.date), max_price=round(r.max_price, 2))
        for r in rows
    ]