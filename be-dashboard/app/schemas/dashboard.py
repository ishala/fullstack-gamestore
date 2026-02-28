from pydantic import BaseModel
from typing import Optional

class PriceRangeByGenre(BaseModel):
    genre: str
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    avg_price: Optional[float] = None
    game_count: int

class PriceRatioItem(BaseModel):
    game_id: int
    game_name: str
    genre: Optional[str] = None
    our_price: float
    price_cheap: Optional[float] = None
    ratio: Optional[float] = None

class PriceGapByGenre(BaseModel):
    genre: str
    avg_our_price: float
    avg_global_price: Optional[float] = None
    avg_gap: Optional[float] = None
    gap_percent: Optional[float] = None

class GamesByDate(BaseModel):
    """COUNT game GROUP BY updated_at."""
    date: str   # "YYYY-MM-DD"
    count: int

class AvgRatingByGenre(BaseModel):
    """AVG rating GROUP BY genre."""
    genre: str
    avg_rating: float
    game_count: int

class SalesByDate(BaseModel):
    """COUNT sales GROUP BY created_at."""
    date: str   # "YYYY-MM-DD"
    count: int

class MaxPriceByDate(BaseModel):
    """MAX our_price GROUP BY created_at."""
    date: str   # "YYYY-MM-DD"
    max_price: float