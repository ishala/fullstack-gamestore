from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GameBase(BaseModel):
    name: str
    slug: str
    released: Optional[datetime] = None
    genre: Optional[str] = None
    rating: Optional[float] = None
    ratings_count: Optional[int] = None
    metacritic: Optional[int] = None
    background_image: Optional[str] = None
    platforms: Optional[str] = None
    price_cheap: Optional[float] = None
    price_external: Optional[float] = None

class GameCreate(GameBase):
    id: int

class GameUpdate(BaseModel):
    name: Optional[str] = None
    released: Optional[datetime] = None
    genre: Optional[str] = None
    rating: Optional[float] = None
    ratings_count: Optional[int] = None
    metacritic: Optional[int] = None
    background_image: Optional[str] = None
    platforms: Optional[str] = None

class GameInDB(GameBase):
    id: int
    fetched_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedGame(BaseModel):
    total: int
    page: int
    page_size: int
    data: list[GameInDB]