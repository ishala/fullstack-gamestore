import asyncio
import httpx
from datetime import datetime, timezone
from celery import Task
from sqlalchemy import create_engine, select, delete as sa_delete
from sqlalchemy.orm import sessionmaker

from app.celery_app import celery
from app.core.config import settings
from app.services.sync_service import (
    _fetch_rawg_games,
    _fetch_cheapshark_price,
    _merge_row,
    _slice_rawg,
    CHEAPSHARK_REQUEST_DELAY,
)


# Sync DB engine untuk Celery worker
def _get_sync_session():
    """Buat sync SQLAlchemy session untuk Celery worker."""
    sync_url = settings.DATABASE_URL.replace(
        "postgresql+asyncpg://", "postgresql+psycopg2://"
    )
    engine = create_engine(sync_url)
    return sessionmaker(bind=engine)

def _upsert_sync(merged_rows: list[dict], fetched: int, skipped: int, self_task) -> tuple[int, int]:
    """Shared upsert + SyncLog — dipakai oleh kedua task."""
    from app.models.game import Game
    from app.models.sync_log import SyncLog

    inserted = updated = 0
    SessionLocal = _get_sync_session()

    with SessionLocal() as db:
        for data in merged_rows:
            existing = db.get(Game, data["id"])
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
                existing.updated_at = datetime.now()
                updated += 1
            else:
                db.add(Game(**data))
                inserted += 1

        # Hapus duplikat slug
        all_games = db.execute(select(Game)).scalars().all()
        seen: dict[str, int] = {}
        to_delete: list[int] = []
        for g in all_games:
            if g.slug in seen:
                older = min(seen[g.slug], g.id)
                to_delete.append(older)
                seen[g.slug] = max(seen[g.slug], g.id)
            else:
                seen[g.slug] = g.id
        if to_delete:
            db.execute(sa_delete(Game).where(Game.id.in_(to_delete)))

        db.add(SyncLog(
            source="rawg+cheapshark",
            synced_at=datetime.now(),
            records_fetched=fetched,
            records_inserted=inserted,
            records_updated=updated,
            records_skipped=skipped,
            status="success",
        ))
        db.commit()

    return inserted, updated

# ── Task 1: Sync sejumlah game (limit max 40) ─────────────────────────────────
@celery.task(
    bind=True,
    name="app.tasks.sync_tasks.sync_games_task",
    max_retries=3,
    default_retry_delay=60,
)
def sync_games_task(self: Task, limit: int = 40) -> dict:
    """Sync sejumlah game terbaru dari RAWG + CheapShark."""

    async def _fetch_all(limit: int) -> tuple[int, int, list[dict]]:
        skipped = 0
        merged_rows = []

        self.update_state(
            state="STARTED",
            meta={"current": 0, "total": limit, "skipped": 0, "message": "Fetching games from RAWG..."},
        )

        timeout = limit * CHEAPSHARK_REQUEST_DELAY + 75 + 30
        async with httpx.AsyncClient(timeout=timeout) as client:
            raw_games, _ = await _fetch_rawg_games(client, limit, page=1)
            fetched = len(raw_games)

            for i, raw in enumerate(raw_games, start=1):
                rawg_data = _slice_rawg(raw)
                self.update_state(
                    state="PROGRESS",
                    meta={"current": i, "total": fetched, "skipped": skipped, "message": f"Processing: {rawg_data['name']}"},
                )
                await asyncio.sleep(CHEAPSHARK_REQUEST_DELAY)
                cs_data = await _fetch_cheapshark_price(client, rawg_data["name"])
                if cs_data is None:
                    skipped += 1
                    continue
                merged_rows.append(_merge_row(rawg_data, cs_data))

        return fetched, skipped, merged_rows

    try:
        fetched, skipped, merged_rows = asyncio.run(_fetch_all(limit))
        inserted, updated = _upsert_sync(merged_rows, fetched, skipped, self)
        return {"records_fetched": fetched, "records_inserted": inserted, "records_updated": updated, "records_skipped": skipped, "status": "success"}

    except Exception as exc:
        try:
            from app.models.sync_log import SyncLog
            SessionLocal = _get_sync_session()
            with SessionLocal() as db:
                db.add(SyncLog(source="rawg+cheapshark", synced_at=datetime.now(), records_fetched=0, records_inserted=0, records_updated=0, records_skipped=0, status="error", message=str(exc)))
                db.commit()
        except Exception:
            pass
        raise self.retry(exc=exc)

# ── Task 2: Sync SEMUA game (loop pagination) ─────────────────────────────────
@celery.task(
    bind=True,
    name="app.tasks.sync_tasks.sync_all_games_task",
    max_retries=3,
    default_retry_delay=60,
)
def sync_all_games_task(self: Task) -> dict:
    """Sync semua game dari RAWG dengan loop pagination sampai habis."""

    async def _fetch_all_pages() -> tuple[int, int, list[dict]]:
        all_merged = []
        skipped = 0
        page = 1
        per_page = 40

        # Timeout besar karena jumlah game tidak diketahui
        async with httpx.AsyncClient(timeout=600) as client:
            while True:
                self.update_state(
                    state="PROGRESS",
                    meta={
                        "current": len(all_merged),
                        "total": "?",
                        "skipped": skipped,
                        "message": f"Fetching page {page} dari RAWG...",
                    },
                )

                raw_games, next_page = await _fetch_rawg_games(client, per_page, page=page)
                if not raw_games:
                    break  # tidak ada data lagi

                for raw in raw_games:
                    rawg_data = _slice_rawg(raw)
                    self.update_state(
                        state="PROGRESS",
                        meta={
                            "current": len(all_merged),
                            "total": "?",
                            "skipped": skipped,
                            "message": f"[Page {page}] Processing: {rawg_data['name']}",
                        },
                    )
                    await asyncio.sleep(CHEAPSHARK_REQUEST_DELAY)
                    cs_data = await _fetch_cheapshark_price(client, rawg_data["name"])
                    if cs_data is None:
                        skipped += 1
                        continue
                    all_merged.append(_merge_row(rawg_data, cs_data))

                if not next_page:
                    break  # RAWG bilang tidak ada halaman berikutnya
                page += 1

        return len(all_merged) + skipped, skipped, all_merged

    try:
        fetched, skipped, merged_rows = asyncio.run(_fetch_all_pages())
        inserted, updated = _upsert_sync(merged_rows, fetched, skipped, self)
        return {"records_fetched": fetched, "records_inserted": inserted, "records_updated": updated, "records_skipped": skipped, "status": "success"}

    except Exception as exc:
        try:
            from app.models.sync_log import SyncLog
            SessionLocal = _get_sync_session()
            with SessionLocal() as db:
                db.add(SyncLog(source="rawg+cheapshark", synced_at=datetime.now(), records_fetched=0, records_inserted=0, records_updated=0, records_skipped=0, status="error", message=str(exc)))
                db.commit()
        except Exception:
            pass
        raise self.retry(exc=exc)