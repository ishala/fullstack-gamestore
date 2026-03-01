import asyncio
import httpx
from datetime import datetime
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


# CELERY TASK
@celery.task(
    bind=True,
    name="app.tasks.sync_tasks.sync_games_task",
    max_retries=3,
    default_retry_delay=60,
)
def sync_games_task(self: Task, limit: int = 40, page: int = 1) -> dict:
    """
    Celery task untuk sync game dari RAWG + CheapShark.
    State: PENDING → STARTED → PROGRESS (per game) → SUCCESS / FAILURE
    """
    from app.models.game import Game
    from app.models.sale import Sale
    from app.models.sync_log import SyncLog

    async def _fetch_all(limit: int, page: int) -> tuple[int, int, int, list[dict]]:
        fetched = skipped = already_exists = 0
        merged_rows = []

        self.update_state(
            state="STARTED",
            meta={"current": 0, "total": limit, "skipped": 0, "message": f"Fetching page {page} from RAWG..."},
        )

        SessionLocal = _get_sync_session()
        with SessionLocal() as db:
            existing_ids = set(row[0] for row in db.execute(select(Game.id)).fetchall())

        timeout = limit * CHEAPSHARK_REQUEST_DELAY + 75 + 30
        async with httpx.AsyncClient(timeout=timeout) as client:
            raw_games = await _fetch_rawg_games(client, limit, page=page)
            fetched = len(raw_games)

            for i, raw in enumerate(raw_games, start=1):
                rawg_data = _slice_rawg(raw)
                self.update_state(
                    state="PROGRESS",
                    meta={"current": i, "total": fetched, "skipped": skipped, "message": f"Processing: {rawg_data['name']}"},
                )

                if rawg_data["id"] in existing_ids:
                    already_exists += 1
                    skipped += 1
                    continue

                await asyncio.sleep(CHEAPSHARK_REQUEST_DELAY)
                cs_data = await _fetch_cheapshark_price(client, rawg_data["name"])
                if cs_data is None:
                    skipped += 1
                    continue

                merged_rows.append(_merge_row(rawg_data, cs_data))

        return fetched, skipped, already_exists, merged_rows

    def _upsert(merged_rows: list[dict], fetched: int, skipped: int) -> tuple[int, int]:
        """Sync: upsert rows ke DB menggunakan psycopg2."""
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

            # Catat SyncLog
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

    try:
        # Step 1-3: async fetch
        fetched, skipped, already_exists, merged_rows = asyncio.run(_fetch_all(limit, page))

        # Step 4: sync upsert ke DB
        inserted, updated = _upsert(merged_rows, fetched, skipped)

        return {
            "records_fetched": fetched,
            "records_inserted": inserted,
            "records_updated": updated,
            "records_skipped": skipped,
            "records_already_exist": already_exists,
            "next_page": page + 1,
            "status": "success",
        }

    except Exception as exc:
        # Catat SyncLog error
        try:
            SessionLocal = _get_sync_session()
            with SessionLocal() as db:
                db.add(SyncLog(
                    source="rawg+cheapshark",
                    synced_at=datetime.now(),
                    records_fetched=0,
                    records_inserted=0,
                    records_updated=0,
                    records_skipped=0,
                    status="error",
                    message=str(exc),
                ))
                db.commit()
        except Exception:
            pass

        raise self.retry(exc=exc)