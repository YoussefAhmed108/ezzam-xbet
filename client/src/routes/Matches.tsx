import { useEffect, useMemo, useState } from "react";
import { useMatches, useMyPredictions } from "../lib/queries";
import MatchCard from "../components/MatchCard";
import { formatLabel } from "../lib/format";
import { SectionTitle, Pill } from "../components/ui";

type Filter = "open" | "all" | "live" | "finished";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "To predict" },
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Done" },
];

const PAGE_SIZE = 6;

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

// A match is "determined" once both teams are known (not placeholder "TBD").
// Undetermined knockout fixtures can't be predicted, so they're hidden from "open".
function isDetermined(m: { home_team: string; away_team: string }): boolean {
  const home = (m.home_team ?? "").trim().toUpperCase();
  const away = (m.away_team ?? "").trim().toUpperCase();
  return home.length > 0 && away.length > 0 && home !== "TBD" && away !== "TBD";
}

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
        padding: "7px 14px",
        borderRadius: 999,
        border: active ? "none" : "1px solid var(--line)",
        background: active ? "var(--primary)" : "var(--surface2)",
        color: active ? "#fff" : "var(--muted)",
        fontSize: 13.5,
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap" as const,
        boxShadow: active
          ? "0 4px 14px color-mix(in oklab, var(--primary) 40%, transparent)"
          : undefined,
      }}
    >
      {children}
    </button>
  );
}

export default function Matches() {
  const matchesQuery = useMatches();
  const predictionsQuery = useMyPredictions();
  const [filter, setFilter] = useState<Filter>("open");
  const [stage, setStage] = useState<string>("all");
  const [page, setPage] = useState(1);

  const predByMatch = useMemo(() => {
    const map = new Map<string, (typeof predictions)[number]>();
    const predictions = predictionsQuery.data ?? [];
    for (const p of predictions) map.set(p.match_id, p);
    return map;
  }, [predictionsQuery.data]);

  const matches = matchesQuery.data ?? [];

  // jokerByStage: stage -> match_id of the currently selected joker (one per stage)
  const [jokerByStage, setJokerByStage] = useState<Map<string, string>>(new Map());

  // Sync from saved predictions whenever they reload
  useEffect(() => {
    const map = new Map<string, string>();
    for (const m of matches) {
      const pred = predByMatch.get(m.id);
      if (pred?.joker && m.stage) map.set(m.stage, m.id);
    }
    setJokerByStage(map);
  }, [predByMatch, matches]);

  const handleJokerToggle = (matchId: string, stage: string) => {
    setJokerByStage((prev) => {
      const next = new Map(prev);
      if (next.get(stage) === matchId) next.delete(stage);
      else next.set(stage, matchId);
      return next;
    });
  };

  const openCount = useMemo(
    () =>
      matches.filter(
        (m) =>
          m.status === "scheduled" &&
          !m.locked &&
          isDetermined(m) &&
          !predByMatch.has(m.id),
      ).length,
    [matches, predByMatch],
  );

  const stages = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) if (m.stage) set.add(m.stage);
    return Array.from(set).sort((a, b) => {
      const ia = STAGE_ORDER.indexOf(a);
      const ib = STAGE_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [matches]);

  const scrollToTop = () => {
    document
      .querySelector(".main-content")
      ?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPage = (updater: (p: number) => number) => {
    setPage(updater);
    scrollToTop();
  };

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };
  const changeStage = (next: string) => {
    setStage(next);
    setPage(1);
  };

  if (matchesQuery.isLoading) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: 280,
          color: "var(--muted)",
          fontFamily: "var(--font-display)",
          fontSize: 14,
        }}
      >
        Loading matches…
      </div>
    );
  }

  if (matchesQuery.isError) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: 280,
          color: "var(--muted)",
          fontFamily: "var(--font-display)",
          fontSize: 14,
        }}
      >
        Couldn't load matches. Make sure the backend is running.
      </div>
    );
  }

  const filtered = matches.filter((m) => {
    const stageMatch = stage === "all" || m.stage === stage;
    if (!stageMatch) return false;
    if (filter === "all") return true;
    if (filter === "live") return m.status === "live";
    if (filter === "finished") return m.status === "finished";
    // "open" = scheduled + not locked + both teams determined + no prediction
    return (
      m.status === "scheduled" &&
      !m.locked &&
      isDetermined(m) &&
      !predByMatch.has(m.id)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div>
      <SectionTitle
        kicker="MAKE YOUR CALLS"
        title="Predict"
        right={
          openCount > 0 ? (
            <Pill
              color="var(--green)"
              bg="color-mix(in oklab, var(--green) 14%, transparent)"
              style={{ fontSize: 12, fontWeight: 800 }}
            >
              {openCount} open now
            </Pill>
          ) : undefined
        }
      />

      {/* Status filter chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        {FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            active={filter === f.key}
            onClick={() => changeFilter(f.key)}
          >
            {f.label}
          </FilterChip>
        ))}
      </div>

      {/* Stage chips */}
      {stages.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 22,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          <FilterChip
            active={stage === "all"}
            onClick={() => changeStage("all")}
          >
            All rounds
          </FilterChip>
          {stages.map((s) => (
            <FilterChip
              key={s}
              active={stage === s}
              onClick={() => changeStage(s)}
            >
              {stageLabel(s)}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Match list */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 17,
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            No matches here
          </h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {matches.length === 0
              ? "Once the schedule is synced from the football API, fixtures will show up here."
              : "No matches match the selected filters."}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pageItems.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predByMatch.get(m.id)}
                jokerActive={!!m.stage && jokerByStage.get(m.stage) === m.id}
                onJokerToggle={m.stage ? () => handleJokerToggle(m.id, m.stage!) : undefined}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                marginTop: 24,
              }}
            >
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => goToPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "7px 14px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--surface2)",
                  border: "1px solid var(--line)",
                  color: safePage === 1 ? "var(--faint)" : "var(--text)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: safePage === 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Prev
              </button>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {safePage} / {totalPages} · {filtered.length} matches
              </span>
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => goToPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "7px 14px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--surface2)",
                  border: "1px solid var(--line)",
                  color: safePage === totalPages ? "var(--faint)" : "var(--text)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: safePage === totalPages ? "not-allowed" : "pointer",
                }}
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
