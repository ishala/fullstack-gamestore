import random
from datetime import datetime
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.game import Game
from app.models.sale import Sale


# ── Konstanta ─────────────────────────────────────────────────────────────────

# Rasio harga toko vs harga global — variasi realistis
# < 1.0 = lebih murah dari global, > 1.0 = lebih mahal
PRICE_RATIO_RANGES = [
    (0.85, 0.95),   # diskon 5-15% dari harga global
    (0.95, 1.05),   # hampir sama dengan harga global
    (1.05, 1.20),   # markup 5-20% dari harga global
    (1.20, 1.50),   # markup premium
]

# Harga fallback jika game tidak punya data harga dari CheapShark
FALLBACK_PRICE_RANGES_BY_GENRE = {
    "Action":           (9.99,  59.99),
    "RPG":              (19.99, 69.99),
    "Shooter":          (14.99, 59.99),
    "Adventure":        (9.99,  49.99),
    "Strategy":         (9.99,  49.99),
    "Simulation":       (14.99, 49.99),
    "Sports":           (19.99, 69.99),
    "Racing":           (14.99, 49.99),
    "Puzzle":           (4.99,  19.99),
    "Indie":            (4.99,  24.99),
    "Platformer":       (9.99,  39.99),
    "Fighting":         (19.99, 59.99),
    "Horror":           (9.99,  29.99),
    "Casual":           (2.99,  14.99),
    "Arcade":           (2.99,  14.99),
    "default":          (9.99,  49.99),
}

# Jumlah sale per game (min, max)
SALES_PER_GAME = (1, 3)


# ── Helper ────────────────────────────────────────────────────────────────────

def _round_price(price: float) -> float:
    """Bulatkan harga ke format yang wajar: .99 atau .49 atau .00"""
    endings = [0.99, 0.49, 0.00]
    base = int(price)
    ending = random.choice(endings)
    result = base + ending
    return max(result, 0.99)  # minimal $0.99


def _get_our_price(game: Game) -> float:
    """
    Hitung our_price berdasarkan harga referensi dari CheapShark.
    Jika tidak ada, pakai fallback berdasarkan genre.
    """
    reference_price = game.price_cheap or game.price_external

    if reference_price and reference_price > 0:
        # Pakai harga global sebagai referensi dengan variasi rasio
        ratio_min, ratio_max = random.choice(PRICE_RATIO_RANGES)
        ratio = random.uniform(ratio_min, ratio_max)
        return _round_price(reference_price * ratio)
    else:
        # Fallback berdasarkan genre
        genre = game.genre or "default"
        price_range = FALLBACK_PRICE_RANGES_BY_GENRE.get(
            genre,
            FALLBACK_PRICE_RANGES_BY_GENRE["default"]
        )
        return _round_price(random.uniform(*price_range))


# ── Main Seeder ───────────────────────────────────────────────────────────────

def seed_sales(max_games: int = None) -> None:
    """
    Seed data sales berdasarkan games yang sudah ada di DB.

    Args:
        max_games: batas jumlah game yang di-seed (None = semua game)
    """
    sync_url = settings.DATABASE_URL.replace(
        "postgresql+asyncpg://", "postgresql+psycopg2://"
    )
    engine = create_engine(sync_url)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as db:
        # Ambil semua game yang ada
        games = db.execute(select(Game)).scalars().all()

        if not games:
            print("❌ Tidak ada game di database. Jalankan sync terlebih dahulu:")
            print("   POST /api/v1/sync/games")
            return

        if max_games:
            games = games[:max_games]

        total_inserted = 0
        total_skipped = 0

        print(f"🎮 Ditemukan {len(games)} game, mulai seeding sales...\n")

        for game in games:
            # Cek apakah game sudah punya sale — idempotent
            existing = db.execute(
                select(Sale).where(Sale.game_id == game.id)
            ).scalars().all()

            if existing:
                print(f"  ⏭️  Skip  — {game.name} (sudah ada {len(existing)} sale)")
                total_skipped += 1
                continue

            # Buat 1-3 sale per game
            num_sales = random.randint(*SALES_PER_GAME)
            for _ in range(num_sales):
                our_price = _get_our_price(game)
                db.add(Sale(
                    game_id=game.id,
                    our_price=our_price,
                ))

            price_ref = game.price_cheap or game.price_external
            ref_str = f"(ref: ${price_ref:.2f})" if price_ref else "(no ref, fallback)"
            print(f"  ✅ Seed  — {game.name} | {num_sales}x sale {ref_str}")
            total_inserted += num_sales

        db.commit()

        print(f"\n{'─' * 50}")
        print(f"✅ Seeding selesai!")
        print(f"   Sales inserted : {total_inserted}")
        print(f"   Games skipped  : {total_skipped} (sudah ada datanya)")
        print(f"{'─' * 50}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed data sales")
    parser.add_argument(
        "--max-games",
        type=int,
        default=None,
        help="Batas jumlah game yang di-seed (default: semua game)"
    )
    args = parser.parse_args()

    seed_sales(max_games=args.max_games)