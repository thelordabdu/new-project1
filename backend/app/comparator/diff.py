"""
diff.py
Nightly comparator — diffs our scores vs Whoop API scores.
Runs as a Celery beat task. Writes delta_* and within_threshold to daily_snapshots.
"""

THRESHOLD_PCT = 5.0  # within 5% = matched
CONSECUTIVE_DAYS_REQUIRED = 14

METRIC_WEIGHTS = {
    "recovery": 0.40,
    "hrv": 0.30,
    "strain": 0.20,
    "sleep_score": 0.10,
}

def compute_delta_pct(api_val: float | None, our_val: float | None) -> float | None:
    """Returns % difference between api and our value. None if either is missing."""
    if api_val is None or our_val is None or api_val == 0:
        return None
    return abs(api_val - our_val) / api_val * 100

def is_within_threshold(delta_pct: float | None, threshold: float = THRESHOLD_PCT) -> bool:
    if delta_pct is None:
        return False
    return delta_pct <= threshold

# TODO: implement run_daily_comparison(user_id, date) -> ComparisonResult
# TODO: implement check_migration_eligibility(user_id) -> bool
