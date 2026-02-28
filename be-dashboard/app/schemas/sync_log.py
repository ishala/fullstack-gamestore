from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SyncLogBase(BaseModel):
    source: str
    records_fetched: int = 0
    records_inserted: int = 0
    records_updated: int = 0
    records_skipped: int = 0
    status: str = "success"
    message: Optional[str] = None

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