from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Game(Base):
    """Data game — gabungan metadata RAWG + harga CheapShark"""
    __tablename__ = "games"

    id = Column(Integer, primary_key=True)            # ID dari RAWG
    slug = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    released = Column(DateTime, nullable=True)        # tanggal rilis
    genre = Column(String(255), nullable=True)        # kategori utama
    rating = Column(Float, nullable=True)
    ratings_count = Column(Integer, nullable=True)
    metacritic = Column(Integer, nullable=True)
    background_image = Column(Text, nullable=True)
    platforms = Column(Text, nullable=True)           # JSON string

    # ── Harga dari CheapShark ─────────────────────────────────────────────────
    price_external = Column(Float, nullable=True)     # harga normal di Steam/external store
    price_cheap = Column(Float, nullable=True)        # harga deal termurah saat ini
    cheapshark_game_id = Column(String(50), nullable=True)  # ID game di CheapShark

    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=True)

    sales = relationship("Sale", back_populates="game", cascade="all, delete-orphan")