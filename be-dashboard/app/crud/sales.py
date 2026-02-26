from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from typing import Optional
from app.models.sale import Sale
from app.models.game import Game
from app.schemas.sale import SaleCreate, SaleUpdate, SaleInDB

async def get_all(
    db: AsyncSession,
    page: int,
    page_size: int,
    search: Optional[str],
    genre: Optional[str],
    sort_by: str,
    sort_dir: str,
) -> tuple[int, list[SaleInDB]]:
    stmt = select(Sale).join(Sale.game)

    if search:
        stmt = stmt.where(Game.name.ilike(f"%{search}%"))
    if genre:
        stmt = stmt.where(Game.genre.ilike(f"%{genre}%"))

    sort_map = {
        "our_price": Sale.our_price,
        "updated_at": Sale.updated_at,
        "created_at": Sale.created_at,
        "game_name": Game.name,
        "genre": Game.genre,
    }
    col = sort_map.get(sort_by, Sale.updated_at)
    stmt = stmt.order_by(col.desc() if sort_dir == "desc" else col.asc())

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.options(joinedload(Sale.game)).offset((page - 1) * page_size).limit(page_size)
    sales = (await db.execute(stmt)).scalars().all()

    result = []
    for s in sales:
        result.append(SaleInDB(
            id=s.id,
            game_id=s.game_id,
            our_price=s.our_price,
            created_at=s.created_at,
            updated_at=s.updated_at,
            game_name=s.game.name if s.game else None,
            game_genre=s.game.genre if s.game else None,
            price_cheap=s.game.price_cheap if s.game else None,
            price_external=s.game.price_external if s.game else None,
        ))
    return total, result


async def get_by_id(db: AsyncSession, sale_id: int) -> Optional[Sale]:
    stmt = select(Sale).where(Sale.id == sale_id).options(joinedload(Sale.game))
    return (await db.execute(stmt)).scalar_one_or_none()


async def create(db: AsyncSession, payload: SaleCreate) -> Sale:
    sale = Sale(**payload.model_dump())
    db.add(sale)
    await db.commit()
    await db.refresh(sale)
    return sale


async def update(db: AsyncSession, sale: Sale, payload: SaleUpdate) -> Sale:
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(sale, k, v)
    await db.commit()
    await db.refresh(sale)
    return sale


async def delete(db: AsyncSession, sale: Sale) -> None:
    await db.delete(sale)
    await db.commit()