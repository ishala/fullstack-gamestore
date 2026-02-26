from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db.database import get_db
from app.schemas.sale import SaleCreate, SaleUpdate, SaleInDB, PaginatedSales
from app.crud.sales import (
    get_all,
    get_by_id,
    create,
    update,
    delete,
)
from app.crud.games import get_by_id as get_game_by_id

router = APIRouter()


# ─── READ: list ───────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedSales)
async def list_sales(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,       # search by nama game
    genre: Optional[str] = None,        # filter by genre
    sort_by: str = Query("updated_at", enum=["our_price", "updated_at", "created_at", "game_name", "genre"]),
    sort_dir: str = Query("desc", enum=["asc", "desc"]),
    db: AsyncSession = Depends(get_db),
):
    total, sales = await get_all(db, page, page_size, search, genre, sort_by, sort_dir)
    return PaginatedSales(total=total, page=page, page_size=page_size, data=sales)


# ─── READ: detail ─────────────────────────────────────────────────────────────

@router.get("/{sale_id}", response_model=SaleInDB)
async def get_sale(sale_id: int, db: AsyncSession = Depends(get_db)):
    sale = await get_by_id(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return SaleInDB(
        id=sale.id,
        game_id=sale.game_id,
        our_price=sale.our_price,
        created_at=sale.created_at,
        updated_at=sale.updated_at,
        game_name=sale.game.name if sale.game else None,
        game_genre=sale.game.genre if sale.game else None,
        price_cheap=sale.game.price_cheap if sale.game else None,
        price_external=sale.game.price_external if sale.game else None,
    )


# ─── CREATE ───────────────────────────────────────────────────────────────────

@router.post("", response_model=SaleInDB, status_code=201)
async def create_sale(payload: SaleCreate, db: AsyncSession = Depends(get_db)):
    # Validasi game_id — harus ada di tabel games
    game = await get_game_by_id(db, payload.game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game with id {payload.game_id} not found")

    sale = await create(db, payload)
    return SaleInDB(
        id=sale.id,
        game_id=sale.game_id,
        our_price=sale.our_price,
        created_at=sale.created_at,
        updated_at=sale.updated_at,
        game_name=game.name,
        game_genre=game.genre,
        price_cheap=game.price_cheap,
        price_external=game.price_external,
    )


# ─── UPDATE ───────────────────────────────────────────────────────────────────

@router.patch("/{sale_id}", response_model=SaleInDB)
async def update_sale(sale_id: int, payload: SaleUpdate, db: AsyncSession = Depends(get_db)):
    sale = await get_by_id(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # Jika game_id diubah, validasi game baru
    if payload.game_id is not None:
        game = await get_game_by_id(db, payload.game_id)
        if not game:
            raise HTTPException(status_code=404, detail=f"Game with id {payload.game_id} not found")

    sale = await update(db, sale, payload)
    return SaleInDB(
        id=sale.id,
        game_id=sale.game_id,
        our_price=sale.our_price,
        created_at=sale.created_at,
        updated_at=sale.updated_at,
        game_name=sale.game.name if sale.game else None,
        game_genre=sale.game.genre if sale.game else None,
        price_cheap=sale.game.price_cheap if sale.game else None,
        price_external=sale.game.price_external if sale.game else None,
    )


# ─── DELETE ───────────────────────────────────────────────────────────────────

@router.delete("/{sale_id}", status_code=204)
async def delete_sale(sale_id: int, db: AsyncSession = Depends(get_db)):
    sale = await get_by_id(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    await delete(db, sale)