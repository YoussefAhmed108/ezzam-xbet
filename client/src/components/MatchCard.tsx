import { useEffect, useState } from "react";
import type { Match, Prediction } from "../lib/types";
import { useSubmitPrediction } from "../lib/queries";
import { ApiError } from "../lib/api";
import { formatKickoff, formatLabel } from "../lib/format";
import { FlagBadge } from "./ui";

function StatusTag({ match, dirty }: { match: Match; dirty?: boolean }) {
  if (match.status === "live") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 9px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          fontFamily: "var(--font-display)",
          background: "color-mix(in oklab, var(--red) 14%, transparent)",
          color: "var(--red)",
          border: "1px solid color-mix(in oklab, var(--red) 30%, transparent)",
        }}
      >
        <span className="live-dot" style={{ width: 6, height: 6 }} />
        Live
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 9px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          fontFamily: "var(--font-display)",
          background: "color-mix(in oklab, var(--faint) 14%, transparent)",
          color: "var(--faint)",
        }}
      >
        Full time
      </span>
    );
  }
  if (match.locked) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 9px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          fontFamily: "var(--font-display)",
          background: "color-mix(in oklab, var(--orange) 14%, transparent)",
          color: "var(--orange)",
        }}
      >
        Locked
      </span>
    );
  }
  if (dirty) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 9px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          fontFamily: "var(--font-display)",
          background: "color-mix(in oklab, var(--yellow) 14%, transparent)",
          color: "var(--yellow)",
        }}
      >
        ● Unsaved
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
        fontFamily: "var(--font-display)",
        background: "color-mix(in oklab, var(--green) 14%, transparent)",
        color: "var(--green)",
      }}
    >
      Open
    </span>
  );
}

function PointsBadge({ prediction }: { prediction: Prediction }) {
  const pts = prediction.points ?? 0;
  if (!prediction.scored) return null;

  if (pts === 3) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          background: "color-mix(in oklab, var(--green) 18%, transparent)",
          color: "var(--green)",
          fontFamily: "var(--font-display)",
          letterSpacing: "0.04em",
          textTransform: "uppercase" as const,
        }}
      >
        EXACT +3
      </span>
    );
  }
  if (pts === 1) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          background: "color-mix(in oklab, var(--yellow) 18%, transparent)",
          color: "var(--yellow)",
          fontFamily: "var(--font-display)",
          letterSpacing: "0.04em",
          textTransform: "uppercase" as const,
        }}
      >
        RESULT +1
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        background: "var(--surface2)",
        color: "var(--faint)",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
      }}
    >
      MISS
    </span>
  );
}

function Stepper({
  value,
  onChange,
  ariaLabel,
  dirty,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  dirty: boolean;
}) {
  const num = parseInt(value, 10);
  const inc = () => onChange(String(isNaN(num) ? 0 : Math.min(num + 1, 99)));
  const dec = () => onChange(String(isNaN(num) ? 0 : Math.max(num - 1, 0)));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <button
        type="button"
        onClick={inc}
        style={{
          width: 30,
          height: 22,
          borderRadius: 6,
          background: "var(--surface2)",
          border: "1px solid var(--line)",
          color: "var(--muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        ▲
      </button>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
        aria-label={ariaLabel}
        style={{
          width: 44,
          height: 40,
          textAlign: "center",
          borderRadius: "var(--r-sm)",
          background: "var(--bg2)",
          border: `1.5px solid ${dirty ? "var(--yellow)" : "var(--line)"}`,
          color: "var(--text)",
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: 18,
          outline: "none",
          boxShadow: dirty ? "0 0 0 3px color-mix(in oklab, var(--yellow) 20%, transparent)" : undefined,
        }}
      />
      <button
        type="button"
        onClick={dec}
        style={{
          width: 30,
          height: 22,
          borderRadius: 6,
          background: "var(--surface2)",
          border: "1px solid var(--line)",
          color: "var(--muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        ▼
      </button>
    </div>
  );
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
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

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
    <div
      style={{
        background: "var(--surface)",
        border: isLive
          ? "1px solid color-mix(in oklab, var(--red) 40%, transparent)"
          : "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        position: "relative",
        animation: "fadeUp .25s both",
      }}
    >
      {/* Live red left strip */}
      {isLive && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "var(--red)",
            borderRadius: "99px 0 0 99px",
          }}
        />
      )}

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 18px 6px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--muted)",
            fontFamily: "var(--font-display)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.04em",
          }}
        >
          {formatLabel(match.group || match.stage) || "Group stage"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusTag match={match} dirty={editable ? dirty : undefined} />
          <span
            style={{
              fontSize: 11.5,
              color: "var(--faint)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {formatKickoff(match.kickoff)}
          </span>
        </div>
      </div>

      {/* Main body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: editable
            ? "minmax(0,1fr) auto minmax(0,1fr)"
            : "minmax(0,1fr) auto minmax(0,1fr) auto",
          alignItems: "center",
          gap: 0,
          padding: "14px 18px",
        }}
      >
        {/* Home team */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <FlagBadge src={match.home_flag} alt={match.home_team} size={32} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14.5,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
              minWidth: 0,
            }}
          >
            {match.home_team}
          </span>
        </div>

        {/* Center: score or stepper */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            minWidth: editable ? 130 : 90,
            padding: "0 12px",
          }}
        >
          {isFinished || isLive ? (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: "0.04em",
                color: isLive ? "var(--red)" : "var(--text)",
              }}
            >
              {match.home_score ?? 0}
              <span style={{ color: "var(--muted)", margin: "0 5px" }}>:</span>
              {match.away_score ?? 0}
            </div>
          ) : editable ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Stepper
                value={home}
                onChange={setHome}
                ariaLabel={`${match.home_team} score`}
                dirty={dirty}
              />
              <span
                style={{
                  color: "var(--muted)",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  fontSize: 18,
                }}
              >
                :
              </span>
              <Stepper
                value={away}
                onChange={setAway}
                ariaLabel={`${match.away_team} score`}
                dirty={dirty}
              />
            </div>
          ) : (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: 20,
                color: "var(--faint)",
              }}
            >
              — : —
            </div>
          )}
        </div>

        {/* Away team */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", minWidth: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14.5,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
              minWidth: 0,
            }}
          >
            {match.away_team}
          </span>
          <FlagBadge src={match.away_flag} alt={match.away_team} size={32} />
        </div>

        {/* Right slot: prediction info or + Predict */}
        {!editable && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
              paddingLeft: 16,
              borderLeft: "1px solid var(--line)",
              marginLeft: 12,
              minWidth: 110,
            }}
          >
            {prediction ? (
              <>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Your call
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 17,
                    color: "var(--text)",
                  }}
                >
                  {prediction.home_score} : {prediction.away_score}
                </span>
                {(isFinished || isLive) && prediction.scored && (
                  <PointsBadge prediction={prediction} />
                )}
              </>
            ) : (
              match.status === "scheduled" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 800,
                    background: "color-mix(in oklab, var(--green) 14%, transparent)",
                    color: "var(--green)",
                    fontFamily: "var(--font-display)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.04em",
                  }}
                >
                  + Predict
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* Editable save row */}
      {editable && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
            padding: "10px 18px 14px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <button
            onClick={onSave}
            disabled={submit.isPending || !dirty}
            style={{
              padding: "8px 20px",
              borderRadius: "var(--r-sm)",
              background: dirty ? "var(--primary)" : "var(--surface2)",
              color: dirty ? "#fff" : "var(--muted)",
              border: "none",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13.5,
              cursor: dirty && !submit.isPending ? "pointer" : "not-allowed",
              opacity: submit.isPending ? 0.6 : 1,
              boxShadow: dirty
                ? "0 4px 14px color-mix(in oklab, var(--primary) 40%, transparent)"
                : undefined,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {submit.isPending ? "Saving…" : prediction ? "Update pick" : "Save pick"}
          </button>
          {!dirty && justSaved && (
            <span
              style={{
                color: "var(--green)",
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              Saved ✓
            </span>
          )}
          {!dirty && !justSaved && prediction && (
            <span
              style={{
                color: "var(--green)",
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              ✓ Pick saved
            </span>
          )}
          {error && (
            <span
              style={{
                color: "var(--red)",
                fontSize: 12.5,
                fontFamily: "var(--font-display)",
              }}
            >
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
