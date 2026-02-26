from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class SyncLog(Base):
    """Mencatat waktu terakhir sinkronisasi"""
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False)
    synced_at = Column(DateTime(timezone=True), server_default=func.now())
    records_fetched = Column(Integer, default=0)
    records_inserted = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    records_skipped = Column(Integer, default=0)      # game tidak ditemukan di CheapShark
    status = Column(String(20), default="success")
    message = Column(Text, nullable=True)