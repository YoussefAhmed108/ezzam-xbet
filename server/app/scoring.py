"""Pure scoring logic for predictions.

Scoring rules:
  - Correct winner/draw AND exact result -> 3 points
  - Correct winner/draw only            -> 1 point
  - Otherwise                           -> 0 points
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
    """Return points for a single prediction given the final result."""
    if pred_home == actual_home and pred_away == actual_away:
        return 3
    if _outcome(pred_home, pred_away) == _outcome(actual_home, actual_away):
        return 1
    return 0
