"""
Router Sync — trigger Celery task & polling status

Endpoint:
- POST /sync/games        → trigger sync task, return task_id
- GET  /sync/status/{id}  → cek progress task
- GET  /sync/last         → last sync log dari DB
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from celery.result import AsyncResult
from typing import Optional

from app.db.database import get_db
from app.celery_app import celery
from app.models.sync_log import SyncLog
from app.schemas.sync_log import SyncLogInDB

router = APIRouter()

# Sync all games: trigger Celery task untuk sync data game dari RAWG + CheapShark
@router.post("/games/all", status_code=202)
async def trigger_sync_all_games():
    from app.tasks import sync_all_games_task
    task = sync_all_games_task.delay()

    return {
        "task_id": task.id,
        "status": "queued",
        "message": f"Sync all games started. Poll /sync/status/{task.id} for progress.",
    }

# Sync games: trigger Celery task untuk sync data game dari RAWG + CheapShark
@router.post("/games", status_code=202)
async def trigger_sync_games(
    limit: int = Query(40, ge=1, le=40, description="Jumlah game yang di-fetch dari RAWG"),
):
    """
    Trigger sync game di background (Celery).
    Return task_id untuk polling progress.
    HTTP 202 Accepted — request diterima, proses berjalan di background.
    """
    from app.tasks import sync_games_task
    task = sync_games_task.delay(limit=limit)

    return {
        "task_id": task.id,
        "status": "queued",
        "message": f"Sync started for {limit} games. Poll /sync/status/{task.id} for progress.",
    }


# Polling status sync task
@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Polling endpoint untuk cek progress sync.

    State yang mungkin:
    - PENDING   : task belum mulai (atau task_id tidak valid)
    - STARTED   : task baru mulai, fetch dari RAWG
    - PROGRESS  : sedang loop per game ke CheapShark
    - SUCCESS   : selesai
    - FAILURE   : gagal
    """
    result = AsyncResult(task_id, app=celery)

    # Task belum diproses / tidak ditemukan
    if result.state == "PENDING":
        return {
            "task_id": task_id,
            "state": "PENDING",
            "progress": {"current": 0, "total": 0},
            "message": "Task is waiting to be processed",
        }

    # Task sedang berjalan (STARTED atau PROGRESS)
    if result.state in ("STARTED", "PROGRESS"):
        meta = result.info or {}
        return {
            "task_id": task_id,
            "state": result.state,
            "progress": {
                "current": meta.get("current", 0),
                "total": meta.get("total", 0),
                "percent": round(
                    meta.get("current", 0) / meta.get("total", 1) * 100, 1
                ),
            },
            "inserted": meta.get("inserted", 0),
            "updated": meta.get("updated", 0),
            "skipped": meta.get("skipped", 0),
            "message": meta.get("message", ""),
        }

    # Task selesai
    if result.state == "SUCCESS":
        return {
            "task_id": task_id,
            "state": "SUCCESS",
            "progress": {"current": 100, "total": 100, "percent": 100},
            **result.result,
        }

    # Task gagal
    if result.state == "FAILURE":
        return {
            "task_id": task_id,
            "state": "FAILURE",
            "message": str(result.info),
        }

    # State lain (RETRY, REVOKED, dll)
    return {"task_id": task_id, "state": result.state}


# Get last sync log dari DB
@router.get("/last", response_model=Optional[SyncLogInDB])
async def get_last_sync(db: AsyncSession = Depends(get_db)):
    """Tampilkan log sync terakhir yang berhasil."""
    stmt = (
        select(SyncLog)
        .where(SyncLog.source == "rawg+cheapshark")
        .order_by(SyncLog.synced_at.desc())
        .limit(1)
    )
    log = (await db.execute(stmt)).scalar_one_or_none()
    return log