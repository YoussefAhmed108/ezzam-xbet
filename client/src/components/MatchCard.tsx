import { useEffect, useState } from "react";
import type { Match, Prediction } from "../lib/types";
import { useSubmitPrediction } from "../lib/queries";
import { ApiError } from "../lib/api";
import { formatKickoff, formatLabel } from "../lib/format";

function StatusBadge({ match, dirty }: { match: Match; dirty?: boolean }) {
  if (match.status === "live")
    return <span className="badge badge-live">● Live</span>;
  if (match.status === "finished")
    return <span className="badge badge-finished">Full time</span>;
  if (match.locked)
    return <span className="badge badge-locked">Locked</span>;
  if (dirty)
    return <span className="badge badge-dirty">● Unsaved</span>;
  return <span className="badge badge-scheduled">Open</span>;
}

function Flag({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span className="flag" aria-hidden />;
  return <img className="flag" src={src} alt={alt} loading="lazy" />;
}

export default function MatchCard({
  match,
  prediction,
}: {
  match: Match;
  prediction?: Prediction;
}) {
  const submit = useSubmitPrediction();
  const [home, setHome] = useState<string>(
    prediction ? String(prediction.home_score) : "",
  );
  const [away, setAway] = useState<string>(
    prediction ? String(prediction.away_score) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (prediction) {
      setHome(String(prediction.home_score));
      setAway(String(prediction.away_score));
    }
  }, [prediction]);

  const editable = match.status === "scheduled" && !match.locked;

  const savedHome = prediction ? String(prediction.home_score) : "";
  const savedAway = prediction ? String(prediction.away_score) : "";
  const hasInput = home !== "" && away !== "";
  const dirty = hasInput && (home !== savedHome || away !== savedAway);

  const onSave = async () => {
    setError(null);
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0) {
      setError("Enter both scores");
      return;
    }
    try {
      await submit.mutateAsync({
        match_id: match.id,
        home_score: h,
        away_score: a,
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save");
    }
  };

  return (
    <div className="card match-card">
      <div className="match-meta">
        <span>
          {formatLabel(match.group || match.stage) || "Group stage"}
        </span>
        <span>{formatKickoff(match.kickoff)}</span>
      </div>

      <div className="match-status">
        <StatusBadge match={match} dirty={editable && dirty} />
      </div>

      <div className="team home">
        <span className="team-name">{match.home_team}</span>
        <Flag src={match.home_flag} alt={match.home_team} />
      </div>

      <div className="center-col">
        {match.status === "finished" ? (
          <div className="final-score">
            {match.home_score} : {match.away_score}
          </div>
        ) : editable ? (
          <div className="score-inputs">
            <input
              className={`input score-input ${dirty ? "dirty" : ""}`}
              inputMode="numeric"
              value={home}
              onChange={(e) =>
                setHome(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
              }
              aria-label={`${match.home_team} score`}
            />
            <span className="score-sep">:</span>
            <input
              className={`input score-input ${dirty ? "dirty" : ""}`}
              inputMode="numeric"
              value={away}
              onChange={(e) =>
                setAway(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
              }
              aria-label={`${match.away_team} score`}
            />
          </div>
        ) : (
          <div className="final-score">
            {prediction ? `${prediction.home_score} : ${prediction.away_score}` : "— : —"}
          </div>
        )}

        {match.status === "finished" && prediction?.scored && (
          <span
            className={`points-tag ${prediction.points ? "earned" : "zero"}`}
          >
            +{prediction.points ?? 0} pts
          </span>
        )}
        {!editable && match.status !== "finished" && prediction && (
          <span className="muted" style={{ fontSize: 12 }}>
            Your pick
          </span>
        )}
      </div>

      <div className="team away">
        <Flag src={match.away_flag} alt={match.away_team} />
        <span className="team-name">{match.away_team}</span>
      </div>

      {editable && (
        <div className="save-row" style={{ gridColumn: "1 / -1" }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={onSave}
            disabled={submit.isPending || !dirty}
          >
            {submit.isPending ? "Saving…" : prediction ? "Update pick" : "Save pick"}
          </button>
          {!dirty && justSaved && <span className="saved-hint">Saved ✓</span>}
          {!dirty && !justSaved && prediction && (
            <span className="saved-hint">✓ Pick saved</span>
          )}
          {error && <span className="field-error">{error}</span>}
        </div>
      )}
    </div>
  );
}
