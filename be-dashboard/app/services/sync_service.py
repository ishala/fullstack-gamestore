import httpx
import asyncio
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.game import Game
from app.models.sync_log import SyncLog
from app.core.config import settings

CHEAPSHARK_REQUEST_DELAY = 1.0   # detik antar request ke CheapShark
CHEAPSHARK_MAX_RETRIES = 3       # maksimal retry saat 429
CHEAPSHARK_RETRY_DELAY = 5.0     # detik tunggu sebelum retry


# STEP 1 — Fetch metadata dari RAWG

async def _fetch_rawg_games(client: httpx.AsyncClient, limit: int, page: int = 1) -> list[dict]:
    params = {
        "key": settings.RAWG_API_KEY,
        "page_size": limit,
        "ordering": "-added",
        "page": page,
    }
    resp = await client.get(f"{settings.RAWG_BASE}/games", params=params)
    resp.raise_for_status()
    data = resp.json()
    return data.get("results", []), data.get("next")


def _slice_rawg(raw: dict) -> dict:
    genres = raw.get("genres", [])
    platforms = raw.get("platforms", [])

    released_str = raw.get("released")
    released_dt = None
    if released_str:
        try:
            released_dt = datetime.strptime(released_str, "%Y-%m-%d")
        except ValueError:
            pass

    return {
        "id": raw["id"],
        "slug": raw["slug"],
        "name": raw["name"],
        "released": released_dt,
        "genre": genres[0]["name"] if genres else None,
        "rating": raw.get("rating"),
        "ratings_count": raw.get("ratings_count"),
        "metacritic": raw.get("metacritic"),
        "background_image": raw.get("background_image"),
        "platforms": json.dumps([p["platform"]["name"] for p in platforms if p.get("platform")]),
    }


# STEP 2 — Fetch harga dari CheapShark per game

def _normalize(text: str) -> str:
    """Lowercase, hapus karakter khusus, strip whitespace berlebih."""
    import re
    text = text.lower().strip()
    text = re.sub(r"[:\-\'\"!?,.]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _best_match(results: list[dict], title_query: str) -> dict | None:
    """
    Cari hasil CheapShark yang paling mendekati title_query.
    Strategi (dari paling ketat ke paling longgar):
    1. Exact match setelah normalisasi
    2. Semua kata dari query ada di nama game
    3. Lebih dari 50% kata query ada di nama game
    4. Fallback ke hasil pertama
    """
    query_norm = _normalize(title_query)
    query_words = [w for w in query_norm.split() if len(w) > 1]

    # Pass 1: exact match setelah normalisasi
    for item in results:
        name_norm = _normalize(item.get("external") or "")
        if name_norm == query_norm:
            return item

    # Pass 2: semua kata query ada di nama game
    for item in results:
        name_norm = _normalize(item.get("external") or "")
        if query_words and all(word in name_norm for word in query_words):
            return item

    # Pass 3: lebih dari 50% kata query cocok
    for item in results:
        name_norm = _normalize(item.get("external") or "")
        if query_words:
            matched = sum(1 for word in query_words if word in name_norm)
            if matched / len(query_words) > 0.5:
                return item

    # Pass 4: tidak ada yang cocok → skip, jangan fallback ke hasil yang tidak relevan
    print(f"[MATCH] query='{query_norm}', fallback to first: '{_normalize(results[0].get('external',''))}'")
    return None


async def _fetch_cheapshark_price(client: httpx.AsyncClient, name: str) -> dict | None:
    """
    Struktur response CheapShark /games:
    - external  : nama game di store (BUKAN harga)
    - cheapest  : harga deal termurah saat ini (string float)
    - gameID    : ID internal CheapShark

    Retry otomatis saat 429 Too Many Requests.
    """
    title_query = name.strip()

    for attempt in range(1, CHEAPSHARK_MAX_RETRIES + 1):
        try:
            resp = await client.get(
                f"{settings.CHEAPSHARK_BASE}/games",
                params={"title": title_query, "limit": 20},
            )

            # 429 → tunggu lalu retry dengan exponential backoff
            if resp.status_code == 429:
                wait = CHEAPSHARK_RETRY_DELAY * attempt  # 5s, 10s, 15s
                print(f"[CheapShark] 429 for '{name}', retry {attempt}/{CHEAPSHARK_MAX_RETRIES} in {wait}s")
                await asyncio.sleep(wait)
                continue

            resp.raise_for_status()
            results = resp.json()

            if not results:
                return None

            best = _best_match(results, title_query)
            if not best:
                return None

            cheap = best.get("cheapest")
            if cheap is None:
                return None

            return {
                "cheapshark_game_id": str(best.get("gameID", "")),
                "price_cheap": float(cheap),
                "price_external": None
            }

        except httpx.HTTPStatusError:
            print(f"[CheapShark] HTTP error for '{name}'")
            return None
        except Exception as e:
            print(f"[CheapShark] error for '{name}': {e}")
            return None

    print(f"[CheapShark] max retries reached for '{name}', skipping")
    return None


# STEP 3 — Gabungkan RAWG + CheapShark jadi satu row
def _merge_row(rawg_data: dict, cs_data: dict) -> dict:
    return {**rawg_data, **cs_data}


# STEP 4 — Upsert semua row ke DB
async def _upsert_games(db: AsyncSession, rows: list[dict]) -> tuple[int, int]:
    inserted = updated = 0

    for data in rows:
        existing = await db.get(Game, data["id"])
        if existing:
            for k, v in data.items():
                setattr(existing, k, v)
            existing.updated_at = datetime.now(timezone.utc)
            updated += 1
        else:
            db.add(Game(**data))
            inserted += 1

    # Hapus duplikat slug
    result = await db.execute(select(Game))
    all_games = result.scalars().all()
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
        await db.execute(delete(Game).where(Game.id.in_(to_delete)))

    return inserted, updated


# MAIN SYNC FUNCTION
async def sync_games(db: AsyncSession, limit: int = 40) -> SyncLog:
    fetched = skipped = inserted = updated = 0
    message = None

    try:
        timeout = limit * CHEAPSHARK_REQUEST_DELAY + (CHEAPSHARK_RETRY_DELAY * CHEAPSHARK_MAX_RETRIES * 3) + 30

        async with httpx.AsyncClient(timeout=timeout) as client:

            # Step 1: Fetch dari RAWG
            raw_games = await _fetch_rawg_games(client, limit)
            fetched = len(raw_games)

            # Step 2 & 3: Map ke CheapShark, gabungkan
            merged_rows: list[dict] = []
            for raw in raw_games:
                rawg_data = _slice_rawg(raw)
                print(f"[RAWG] name='{rawg_data['name']}' slug='{rawg_data['slug']}'")  # ← tambah ini

                await asyncio.sleep(CHEAPSHARK_REQUEST_DELAY)

                cs_data = await _fetch_cheapshark_price(client, rawg_data["name"])
                print(f"[CS] result: {cs_data}")  # ← tambah ini
                if cs_data is None:
                    skipped += 1
                    continue

                merged_rows.append(_merge_row(rawg_data, cs_data))

        # Step 4: Upsert ke DB
        inserted, updated = await _upsert_games(db, merged_rows)
        await db.commit()
        status = "success"

    except Exception as e:
        await db.rollback()
        status = "error"
        message = str(e)
        fetched = skipped = inserted = updated = 0

    log = SyncLog(
        source="rawg+cheapshark",
        synced_at=datetime.now(timezone.utc),
        records_fetched=fetched,
        records_inserted=inserted,
        records_updated=updated,
        records_skipped=skipped,
        status=status,
        message=message,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log