from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PriceRangeByGenre(BaseModel):
    """Chart 1: Kisaran harga global per genre (min, max, avg)."""
    genre: str
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    avg_price: Optional[float] = None
    game_count: int

class PriceRatioItem(BaseModel):
    """Chart 2: Rasio harga toko vs harga global per game."""
    game_id: int
    game_name: str
    genre: Optional[str] = None
    our_price: float
    price_cheap: Optional[float] = None    # pembanding: harga global termurah
    ratio: Optional[float] = None          # our_price / price_cheap

class PriceGapByGenre(BaseModel):
    """Chart 3: Rata-rata selisih harga toko vs global per genre."""
    genre: str
    avg_our_price: float
    avg_global_price: Optional[float] = None
    avg_gap: Optional[float] = None        # avg_our_price - avg_global_price
    gap_percent: Optional[float] = None    # selisih dalam persen