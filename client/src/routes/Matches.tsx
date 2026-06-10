import { useMemo, useState } from "react";
import { useMatches, useMyPredictions } from "../lib/queries";
import MatchCard from "../components/MatchCard";
import type { MatchStatus } from "../lib/types";
import { formatLabel } from "../lib/format";

type Filter = "all" | MatchStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Finished" },
];

const PAGE_SIZE = 12;

// Tournament order for known stages; unknown stages sort to the end.
const STAGE_ORDER = [
  "GROUP_STAGE",
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "3rd Place",
  FINAL: "Final",
};

function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? formatLabel(stage);
}

export default function Matches() {
  const matchesQuery = useMatches();
  const predictionsQuery = useMyPredictions();
  const [filter, setFilter] = useState<Filter>("all");
  const [stage, setStage] = useState<string>("all");
  const [page, setPage] = useState(1);

  const predByMatch = useMemo(() => {
    const map = new Map<string, (typeof predictions)[number]>();
    const predictions = predictionsQuery.data ?? [];
    for (const p of predictions) map.set(p.match_id, p);
    return map;
  }, [predictionsQuery.data]);

  const matches = matchesQuery.data ?? [];

  const stages = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) if (m.stage) set.add(m.stage);
    return Array.from(set).sort((a, b) => {
      const ia = STAGE_ORDER.indexOf(a);
      const ib = STAGE_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [matches]);

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };
  const changeStage = (next: string) => {
    setStage(next);
    setPage(1);
  };

  if (matchesQuery.isLoading) {
    return <div className="loading">Loading matches…</div>;
  }

  if (matchesQuery.isError) {
    return (
      <div className="center-state">
        Couldn't load matches. Make sure the backend is running.
      </div>
    );
  }

  const filtered = matches.filter(
    (m) =>
      (filter === "all" || m.status === filter) &&
      (stage === "all" || m.stage === stage),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div>
      <div className="page-head">
        <h1>Matches</h1>
        <p>
          Predict the exact score. Picks lock 2 hours before kickoff. Exact
          result = 3 pts, correct outcome = 1 pt.
        </p>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f.key}
            className={`filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => changeFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {stages.length > 0 && (
        <div className="filters">
          <button
            type="button"
            className={`filter-btn ${stage === "all" ? "active" : ""}`}
            onClick={() => changeStage("all")}
          >
            All stages
          </button>
          {stages.map((s) => (
            <button
              type="button"
              key={s}
              className={`filter-btn ${stage === s ? "active" : ""}`}
              onClick={() => changeStage(s)}
            >
              {stageLabel(s)}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card empty">
          <h3>No matches yet</h3>
          <p>
            {matches.length === 0
              ? "Once the schedule is synced from the football API, fixtures will show up here."
              : "No matches match the selected filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="match-list">
            {pageItems.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predByMatch.get(m.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              <span className="muted" style={{ fontSize: 13 }}>
                Page {safePage} of {totalPages} · {filtered.length} matches
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
