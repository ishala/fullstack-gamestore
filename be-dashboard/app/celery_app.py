from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery = Celery(
    "game_store",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.sync_tasks"],
)

celery.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,

    # Result backend — simpan hasil task di Redis selama 1 jam
    result_expires=3600,

    # Retry — jika worker mati saat task berjalan, task di-requeue
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # ── Celery Beat Schedule ──────────────────────────────────────────────────
    beat_schedule={
        "auto-sync-games-daily": {
            "task": "app.tasks.sync_tasks.sync_games_task",
            "schedule": crontab(hour=2, minute=0),  # setiap hari jam 02:00 UTC
            "kwargs": {"limit": 40},
        },
    },
)