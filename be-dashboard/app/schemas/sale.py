from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SaleBase(BaseModel):
    game_id: int
    our_price: float = Field(..., gt=0)     

class SaleCreate(SaleBase):
    pass

class SaleUpdate(BaseModel):
    game_id: Optional[int] = None
    our_price: Optional[float] = Field(None, gt=0)

class SaleInDB(SaleBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    game_name: Optional[str] = None
    game_genre: Optional[str] = None
    price_cheap: Optional[float] = None
    price_external: Optional[float] = None

    class Config:
        from_attributes = True

class PaginatedSales(BaseModel):
    total: int
    page: int
    page_size: int
    data: list[SaleInDB]