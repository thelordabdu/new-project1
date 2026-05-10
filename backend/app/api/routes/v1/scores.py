from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text

from app.database import DbSession

router = APIRouter()


class DailyScoresResponse(BaseModel):
    date: str
    provider_source: str  # 'whoop_api' | 'our_algo'
    recovery: float | None
    hrv_rmssd: float | None
    resting_hr: float | None
    strain: float | None
    sleep_score: float | None


@router.get(
    "/scores",
    response_model=DailyScoresResponse,
    summary="Get daily scores (phase-aware)",
    tags=["External: Scores"],
)
def get_scores(
    user_id: Annotated[UUID, Query(description="User ID")],
    score_date: Annotated[date | None, Query(description="Date (defaults to today)")] = None,
    db: DbSession = None,
) -> DailyScoresResponse:
    target_date = score_date or date.today()

    user_row = db.execute(
        text('SELECT algo_phase FROM "user" WHERE id = :uid'),
        {"uid": str(user_id)},
    ).fetchone()

    if not user_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    algo_phase = user_row.algo_phase

    snapshot = db.execute(
        text("SELECT * FROM daily_snapshots WHERE user_id = :uid AND date = :d"),
        {"uid": str(user_id), "d": target_date},
    ).fetchone()

    if not snapshot:
        return DailyScoresResponse(
            date=str(target_date),
            provider_source="whoop_api" if algo_phase == "whoop_primary" else "our_algo",
            recovery=None,
            hrv_rmssd=None,
            resting_hr=None,
            strain=None,
            sleep_score=None,
        )

    if algo_phase == "whoop_primary":
        return DailyScoresResponse(
            date=str(snapshot.date),
            provider_source="whoop_api",
            recovery=snapshot.api_recovery_score,
            hrv_rmssd=snapshot.api_hrv_rmssd,
            resting_hr=snapshot.api_resting_hr,
            strain=snapshot.api_strain,
            sleep_score=snapshot.api_sleep_score,
        )

    return DailyScoresResponse(
        date=str(snapshot.date),
        provider_source="our_algo",
        recovery=snapshot.our_recovery_score,
        hrv_rmssd=snapshot.our_hrv_rmssd,
        resting_hr=snapshot.our_resting_hr,
        strain=snapshot.our_strain,
        sleep_score=snapshot.our_sleep_score,
    )
