from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SyncLogBase(BaseModel):
    source: str                       # "rawg+cheapshark", "rawg", "cheapshark"
    records_fetched: int = 0          # total game yang di-fetch dari API
    records_inserted: int = 0         # game baru yang diinsert ke DB
    records_updated: int = 0          # game yang diupdate di DB
    records_skipped: int = 0          # game tidak ditemukan di CheapShark
    status: str = "success"           # "success" | "error"
    message: Optional[str] = None     # pesan error jika status = "error"

class SyncLogCreate(SyncLogBase):
    """
    Dipakai secara internal oleh sync_service untuk membuat log baru.
    synced_at di-generate otomatis oleh DB, tidak perlu diisi manual.
    """
    pass

class SyncLogInDB(SyncLogBase):
    """
    Representasi SyncLog yang ada di database.
    Dipakai sebagai response setelah sync selesai.
    """
    id: int
    synced_at: datetime

    class Config:
        from_attributes = True