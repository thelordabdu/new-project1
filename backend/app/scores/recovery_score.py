"""
recovery_score.py
Our recovery score algorithm. Pure function — input raw data, output 0-100.
No DB calls inside this function.
Validated against Whoop API output via comparator/diff.py.
"""

def compute_recovery(
    hrv_rmssd: float,
    resting_hr: float,
    sleep_hours: float,
    spo2: float | None = None,
    skin_temp_delta: float | None = None,
    algo_version: str = "0.1.0",
) -> float:
    """
    v0.1.0 — initial formula. Will be tuned via comparator feedback.
    Returns 0-100 score matching Whoop's recovery scale.
    """
    # TODO: implement weighted formula
    # Inputs:
    #   hrv_rmssd: higher = better recovery
    #   resting_hr: lower = better
    #   sleep_hours: more = better (up to ~9h)
    #   spo2: higher = better (optional)
    #   skin_temp_delta: deviation from baseline (higher = worse, optional)
    raise NotImplementedError("recovery_score v0.1.0 not yet implemented")
