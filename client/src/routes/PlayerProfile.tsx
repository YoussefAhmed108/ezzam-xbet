import { useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useUserStats, useUserPredictions } from "../lib/queries";
import { Avatar, SectionTitle } from "../components/ui";
import type { UserPredictionEntry } from "../lib/types";

type Filter = "all" | "exact" | "correct" | "missed" | "upcoming";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 13px",
        borderRadius: 999,
        border: active ? "none" : "1px solid var(--line)",
        background: active ? "var(--primary)" : "var(--surface2)",
        color: active ? "#fff" : "var(--muted)",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap" as const,
        boxShadow: active
          ? "0 4px 14px color-mix(in oklab, var(--primary) 35%, transparent)"
          : undefined,
      }}
    >
      {children}
    </button>
  );
}

function PredictionRow({ entry }: { entry: UserPredictionEntry }) {
  const ptColor =
    entry.points === 3
      ? "var(--green)"
      : entry.points === 1
      ? "var(--yellow)"
      : entry.scored
      ? "var(--muted)"
      : "var(--faint)";
  const ptLabel =
    entry.points === 3
      ? "+3"
      : entry.points === 1
      ? "+1"
      : entry.scored
      ? "0"
      : "—";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 18px",
        borderBottom: "1px solid var(--line)",
      }}
    >
      {/* Teams + result */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap" as const,
            rowGap: 2,
          }}
        >
          {entry.match.home_flag && (
            <img
              src={entry.match.home_flag}
              alt=""
              style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          )}
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--text)",
            }}
          >
            {entry.match.home_team}
          </span>
          <span style={{ color: "var(--faint)", fontSize: 12 }}>vs</span>
          {entry.match.away_flag && (
            <img
              src={entry.match.away_flag}
              alt=""
              style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          )}
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--text)",
            }}
          >
            {entry.match.away_team}
          </span>
        </div>
        {entry.match.home_score != null && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Result: {entry.match.home_score}–{entry.match.away_score}
          </div>
        )}
        {!entry.scored && entry.match.status !== "finished" && (
          <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 2, fontWeight: 700, fontFamily: "var(--font-display)", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
            {entry.match.status === "live" ? "Live" : "Upcoming"}
          </div>
        )}
      </div>

      {/* Their pick */}
      <div style={{ textAlign: "center" as const }}>
        <div style={{ fontSize: 11, color: "var(--faint)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>
          Pick
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          {entry.home_score}–{entry.away_score}
        </div>
      </div>

      {/* Points */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 18,
          fontWeight: 800,
          color: ptColor,
          minWidth: 32,
          textAlign: "right" as const,
        }}
      >
        {ptLabel}
      </div>
    </div>
  );
}

export default function PlayerProfile() {
  const { userId } = useParams({ strict: false }) as { userId: string };
  const [filter, setFilter] = useState<Filter>("all");

  const { data: stats, isLoading: statsLoading } = useUserStats(userId);
  const { data: predictions, isLoading: predsLoading } = useUserPredictions(userId);

  const filtered = useMemo<UserPredictionEntry[]>(() => {
    if (!predictions) return [];
    switch (filter) {
      case "exact":    return predictions.filter((p) => p.points === 3);
      case "correct":  return predictions.filter((p) => p.points === 1);
      case "missed":   return predictions.filter((p) => p.scored && p.points === 0);
      case "upcoming": return predictions.filter((p) => !p.scored);
      default:         return predictions;
    }
  }, [predictions, filter]);

  const counts = useMemo(() => {
    if (!predictions) return { exact: 0, correct: 0, missed: 0, upcoming: 0 };
    return {
      exact:    predictions.filter((p) => p.points === 3).length,
      correct:  predictions.filter((p) => p.points === 1).length,
      missed:   predictions.filter((p) => p.scored && p.points === 0).length,
      upcoming: predictions.filter((p) => !p.scored).length,
    };
  }, [predictions]);

  const statTile = (value: React.ReactNode, label: string, color: string) => (
    <div
      style={{
        flex: 1,
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-sm)",
        padding: "14px 10px",
        textAlign: "center" as const,
        minWidth: 0,
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 24, color, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontFamily: "var(--font-display)" }}>
        {label}
      </div>
    </div>
  );

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => window.history.back()}
        style={{
          background: "none",
          border: "none",
          color: "var(--muted)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 13.5,
          cursor: "pointer",
          padding: "0 0 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Back
      </button>

      {statsLoading ? (
        <div style={{ color: "var(--muted)", fontFamily: "var(--font-display)", fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Loading…
        </div>
      ) : stats ? (
        <>
          {/* Profile header card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-lg)",
              padding: "24px",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--line)" }}>
              {stats.avatar_url ? (
                <img
                  src={stats.avatar_url}
                  alt={stats.nickname}
                  style={{ width: 66, height: 66, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 0 0 3px var(--bg2), 0 0 0 5px var(--primary)" }}
                />
              ) : (
                <Avatar nickname={stats.nickname} size={66} />
              )}
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 3 }}>
                  {stats.nickname}
                </h1>
                {(stats.first_name || stats.last_name) && (
                  <div style={{ fontSize: 14, color: "var(--muted)" }}>
                    {[stats.first_name, stats.last_name].filter(Boolean).join(" ")}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 10 }}>
              {statTile(stats.total_points, "Total points", "var(--primary)")}
              {statTile(stats.exact, "Exact results", "var(--green)")}
              {statTile(stats.outcome, "Correct outcomes", "var(--yellow)")}
            </div>
          </div>

          {/* Predictions section */}
          <SectionTitle kicker="LOCKED PICKS" title="Predictions" />

          {/* Filter chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 16 }}>
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              All {predictions ? `(${predictions.length})` : ""}
            </FilterChip>
            <FilterChip active={filter === "exact"} onClick={() => setFilter("exact")}>
              Exact ({counts.exact})
            </FilterChip>
            <FilterChip active={filter === "correct"} onClick={() => setFilter("correct")}>
              Correct ({counts.correct})
            </FilterChip>
            <FilterChip active={filter === "missed"} onClick={() => setFilter("missed")}>
              Missed ({counts.missed})
            </FilterChip>
            <FilterChip active={filter === "upcoming"} onClick={() => setFilter("upcoming")}>
              Upcoming ({counts.upcoming})
            </FilterChip>
          </div>

          {/* Predictions list */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {predsLoading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontFamily: "var(--font-display)", fontSize: 14 }}>
                Loading predictions…
              </div>
            ) : !filtered.length ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontFamily: "var(--font-display)", fontSize: 14 }}>
                No predictions in this category yet.
              </div>
            ) : (
              filtered.map((entry) => <PredictionRow key={entry.match.id} entry={entry} />)
            )}
          </div>
        </>
      ) : (
        <div style={{ color: "var(--muted)", fontFamily: "var(--font-display)", fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Player not found.
        </div>
      )}
    </div>
  );
}
