from __future__ import annotations

"""Pure scoring logic for predictions.

Group stage:
  - Correct winner/draw AND exact result -> 3 points
  - Correct winner/draw only            -> 1 point
  - Otherwise                           -> 0 points

Knockout rounds:
  - AET score is treated as the final score; base points same 3/1/0 rules
  - +1 bonus if match went to penalties AND prediction has the exact pen score
  - Max possible: 4 (exact AET + correct pens)
"""


def _outcome(home: int, away: int) -> str:
    if home > away:
        return "home"
    if home < away:
        return "away"
    return "draw"


def calculate_points(
    pred_home: int, pred_away: int, actual_home: int, actual_away: int
) -> int:
    """Return base points for a single prediction given the final result."""
    if pred_home == actual_home and pred_away == actual_away:
        return 3
    if _outcome(pred_home, pred_away) == _outcome(actual_home, actual_away):
        return 1
    return 0


def is_knockout_stage(stage: str | None) -> bool:
    """True for any knockout round (everything except group stage)."""
    if not stage:
        return False
    return "GROUP" not in stage.upper()


def calculate_points_knockout(
    pred_home: int,
    pred_away: int,
    actual_home: int,
    actual_away: int,
    pred_pen_home: int | None,
    pred_pen_away: int | None,
    actual_pen_home: int | None,
    actual_pen_away: int | None,
) -> int:
    """Knockout scoring: base points on AET score + optional +1 pen bonus."""
    base = calculate_points(pred_home, pred_away, actual_home, actual_away)
    if (
        actual_pen_home is not None
        and actual_pen_away is not None
        and pred_pen_home is not None
        and pred_pen_away is not None
        and pred_pen_home == actual_pen_home
        and pred_pen_away == actual_pen_away
    ):
        base += 1
    return base
