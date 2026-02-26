from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.models.game import Game
from app.schemas.game import GameCreate, GameUpdate

async def get_all(
    db: AsyncSession,
    page: int,
    page_size: int,
    search: Optional[str],
    genre: Optional[str],
    sort_by: str,
    sort_dir: str,
) -> tuple[int, list[Game]]:
    stmt = select(Game)

    if search:
        stmt = stmt.where(Game.name.ilike(f"%{search}%"))
    if genre:
        stmt = stmt.where(Game.genre.ilike(f"%{genre}%"))

    col = getattr(Game, sort_by)
    stmt = stmt.order_by(col.desc() if sort_dir == "desc" else col.asc())

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    games = (await db.execute(stmt)).scalars().all()

    return total, games

async def get_by_id(db: AsyncSession, game_id: int) -> Optional[Game]:
    return await db.get(Game, game_id)

async def get_by_slug(db: AsyncSession, slug: str) -> Optional[Game]:
    stmt = select(Game).where(Game.slug == slug)
    return (await db.execute(stmt)).scalar_one_or_none()

async def create(db: AsyncSession, payload: GameCreate) -> Game:
    game = Game(**payload.model_dump())
    db.add(game)
    await db.commit()
    await db.refresh(game)
    return game

async def update(db: AsyncSession, game: Game, payload: GameUpdate) -> Game:
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(game, k, v)
    await db.commit()
    await db.refresh(game)
    return game

async def delete(db: AsyncSession, game: Game) -> None:
    await db.delete(game)
    await db.commit()