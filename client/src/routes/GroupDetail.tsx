import { useMemo, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import {
  useGroup,
  useGroupPredictions,
  useLeaveGroup,
} from "../lib/queries";
import { useAuth } from "../lib/auth";
import type { GroupMember, Match, MatchPredictions } from "../lib/types";

const columnHelper = createColumnHelper<GroupMember>();

export default function GroupDetail() {
  const { groupId } = useParams({ from: "/_authenticated/groups/$groupId" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const groupQuery = useGroup(groupId);
  const leave = useLeaveGroup();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"leaderboard" | "predictions">("leaderboard");
  const [scoreMode, setScoreMode] = useState<"finished" | "live">("finished");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "points", desc: true },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("rank", {
        header: "#",
        cell: (info) => {
          const rank = info.getValue();
          return (
            <span className={`rank-cell ${rank === 1 ? "rank-1" : ""}`}>
              {rank === 1 ? "🏆" : rank}
            </span>
          );
        },
      }),
      columnHelper.accessor("nickname", {
        header: "Player",
        cell: (info) => <strong>{info.getValue()}</strong>,
      }),
      columnHelper.accessor("points", {
        header: scoreMode === "live" ? "Live points" : "Points",
        cell: (info) => info.getValue(),
      }),
    ],
    [scoreMode],
  );

  const rawMembers = groupQuery.data?.members ?? [];
  const data = useMemo(() => {
    const ranked = rawMembers.map((m) => ({
      ...m,
      points: scoreMode === "live" ? m.live_points : m.points,
    }));
    ranked.sort((a, b) => b.points - a.points);
    return ranked.map((m, i) => ({ ...m, rank: i + 1 }));
  }, [rawMembers, scoreMode]);

  const hasLiveDelta = rawMembers.some((m) => m.live_points !== m.points);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (groupQuery.isLoading) return <div className="loading">Loading group…</div>;
  if (groupQuery.isError || !groupQuery.data)
    return <div className="center-state">Group not found.</div>;

  const group = groupQuery.data;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const onLeave = async () => {
    if (!confirm(`Leave "${group.name}"?`)) return;
    await leave.mutateAsync(group.id);
    await navigate({ to: "/groups" });
  };

  return (
    <div>
      <div className="page-head spread">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate({ to: "/groups" })}
            style={{ marginBottom: 8, paddingLeft: 0 }}
          >
            ← All groups
          </button>
          <h1>{group.name}</h1>
          <p>
            {group.member_count} member{group.member_count === 1 ? "" : "s"}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onLeave}>
          Leave group
        </button>
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="spread">
          <div>
            <div className="section-title" style={{ margin: 0 }}>
              Invite friends
            </div>
            <span className="muted" style={{ fontSize: 13 }}>
              Share this code so friends can join.
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="code-pill">{group.invite_code}</span>
            <button className="btn btn-secondary btn-sm" onClick={copyCode}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${tab === "leaderboard" ? "active" : ""}`}
          onClick={() => setTab("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          className={`filter-btn ${tab === "predictions" ? "active" : ""}`}
          onClick={() => setTab("predictions")}
        >
          Predictions
        </button>
      </div>

      {tab === "leaderboard" ? (
        <div>
          <div className="lb-toolbar">
            <div className="filters" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className={`filter-btn ${scoreMode === "finished" ? "active" : ""}`}
                onClick={() => setScoreMode("finished")}
              >
                Finished
              </button>
              <button
                type="button"
                className={`filter-btn ${scoreMode === "live" ? "active" : ""}`}
                onClick={() => setScoreMode("live")}
              >
                Live{hasLiveDelta ? " ●" : ""}
              </button>
            </div>
            <span className="muted" style={{ fontSize: 12.5 }}>
              {scoreMode === "live"
                ? "Includes provisional points from in-progress matches."
                : "Official points from finished matches only."}
            </span>
          </div>
          <div className="card">
          <table className="table">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{ asc: " ▲", desc: " ▼" }[
                        header.column.getIsSorted() as string
                      ] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.original.user_id === user?.id ? "row-me" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <PredictionsPanel groupId={group.id} currentUserId={user?.id} />
      )}
    </div>
  );
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Flag({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span className="flag" aria-hidden />;
  return <img className="flag" src={src} alt={alt} loading="lazy" />;
}

// Mirrors the backend scoring rules (3 exact, 1 correct outcome, 0 otherwise).
function calcPoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
): number {
  if (predHome === actualHome && predAway === actualAway) return 3;
  const sign = (h: number, a: number) => Math.sign(h - a);
  return sign(predHome, predAway) === sign(actualHome, actualAway) ? 1 : 0;
}

function MatchStatusBadge({ match }: { match: Match }) {
  if (match.status === "live")
    return <span className="badge badge-live">● Live</span>;
  if (match.status === "finished")
    return <span className="badge badge-finished">Full time</span>;
  return <span className="badge badge-locked">Locked</span>;
}

function MatchHeader({ match }: { match: Match }) {
  const finished = match.status === "finished";
  const live = match.status === "live";
  return (
    <div className="pred-match-head">
      <div className="pred-teams">
        <Flag src={match.home_flag} alt={match.home_team} />
        <strong>{match.home_team}</strong>
        {finished || live ? (
          <span className="pred-score">
            {match.home_score ?? 0} – {match.away_score ?? 0}
          </span>
        ) : (
          <span className="pred-vs">vs</span>
        )}
        <strong>{match.away_team}</strong>
        <Flag src={match.away_flag} alt={match.away_team} />
      </div>
      <div className="pred-head-meta">
        <MatchStatusBadge match={match} />
        <span className="muted" style={{ fontSize: 13 }}>
          {finished
            ? "Full time"
            : live
              ? "In progress"
              : formatKickoff(match.kickoff)}
        </span>
      </div>
    </div>
  );
}

function MatchPredictionsCard({
  match,
  predictions,
  currentUserId,
}: {
  match: Match;
  predictions: MatchPredictions["predictions"];
  currentUserId?: string;
}) {
  const finished = match.status === "finished";
  const live = match.status === "live";
  const hasResult =
    (finished || live) &&
    match.home_score !== null &&
    match.away_score !== null;
  const showPoints = finished || (live && hasResult);

  return (
    <div className="card card-pad">
      <MatchHeader match={match} />

      {predictions.length === 0 ? (
        <div className="pred-empty">
          No one in this group predicted this match.
        </div>
      ) : (
        <>
          <table className="table pred-table">
            <thead>
              <tr>
                <th>Player</th>
                <th className="num">
                  <span className="th-team">
                    <Flag src={match.home_flag} alt={match.home_team} />
                    {match.home_team}
                  </span>
                </th>
                <th className="num">
                  <span className="th-team">
                    <Flag src={match.away_flag} alt={match.away_team} />
                    {match.away_team}
                  </span>
                </th>
                {showPoints && (
                  <th className="num">{live ? "Live pts" : "Points"}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {hasResult && (
                <tr className="pred-result-row">
                  <td>{live ? "Live score" : "Final result"}</td>
                  <td className="num">{match.home_score}</td>
                  <td className="num">{match.away_score}</td>
                  {showPoints && <td className="num" />}
                </tr>
              )}
              {predictions.map((p) => {
                const isMe = p.user_id === currentUserId;
                const exact =
                  hasResult &&
                  match.home_score === p.home_score &&
                  match.away_score === p.away_score;
                const livePoints = hasResult
                  ? calcPoints(
                      p.home_score,
                      p.away_score,
                      match.home_score as number,
                      match.away_score as number,
                    )
                  : 0;
                return (
                  <tr
                    key={p.user_id}
                    className={`${isMe ? "row-me" : ""} ${
                      exact ? "pred-row-exact" : ""
                    }`}
                  >
                    <td>
                      <strong>{p.nickname}</strong>
                      {isMe && <span className="you-tag">You</span>}
                    </td>
                    <td className="num">{p.home_score}</td>
                    <td className="num">{p.away_score}</td>
                    {showPoints && (
                      <td className="num">
                        {finished ? (
                          p.scored ? (
                            <span
                              className={`points-tag ${
                                p.points ? "earned" : "zero"
                              }`}
                            >
                              {exact
                                ? "Exact +3"
                                : p.points
                                  ? `Outcome +${p.points}`
                                  : "+0"}
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )
                        ) : (
                          <span
                            className={`points-tag ${
                              livePoints ? "earned" : "zero"
                            }`}
                          >
                            {exact
                              ? "Exact +3"
                              : livePoints
                                ? `On track +${livePoints}`
                                : "+0"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {live && (
            <div className="pred-caption">
              Live — provisional points update with the score. Final points are
              awarded at full time.
            </div>
          )}
          {!finished && !live && (
            <div className="pred-caption">
              Predictions are locked. Points are awarded once the match finishes.
            </div>
          )}
        </>
      )}
    </div>
  );
}

type PredFilter = "all" | "locked" | "live" | "finished";

function PredictionsPanel({
  groupId,
  currentUserId,
}: {
  groupId: string;
  currentUserId?: string;
}) {
  const { data, isLoading, isError } = useGroupPredictions(groupId);
  const [filter, setFilter] = useState<PredFilter>("all");

  if (isLoading) return <div className="loading">Loading predictions…</div>;
  if (isError) return <div className="center-state">Couldn't load predictions.</div>;

  const blocks = data ?? [];
  if (blocks.length === 0) {
    return (
      <div className="card empty">
        <h3>Nothing to reveal yet</h3>
        <p>
          Members' predictions appear here once a match's deadline (2 hours before
          kickoff) has passed.
        </p>
      </div>
    );
  }

  const counts = {
    all: blocks.length,
    locked: blocks.filter((b) => b.match.status === "scheduled").length,
    live: blocks.filter((b) => b.match.status === "live").length,
    finished: blocks.filter((b) => b.match.status === "finished").length,
  };

  const options: { id: PredFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "locked", label: "Locked" },
    { id: "live", label: "Live" },
    { id: "finished", label: "Finished" },
  ];

  const filtered = blocks.filter(({ match }) =>
    filter === "all"
      ? true
      : filter === "locked"
        ? match.status === "scheduled"
        : match.status === filter,
  );

  return (
    <div>
      <div className="filters">
        {options.map((opt) =>
          opt.id === "all" || counts[opt.id] > 0 ? (
            <button
              type="button"
              key={opt.id}
              className={`filter-btn ${filter === opt.id ? "active" : ""}`}
              onClick={() => setFilter(opt.id)}
            >
              {opt.label} ({counts[opt.id]})
            </button>
          ) : null,
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">
          <h3>No {filter} matches</h3>
          <p>Try a different filter.</p>
        </div>
      ) : (
        <div className="stack">
          {filtered.map(({ match, predictions }) => (
            <MatchPredictionsCard
              key={match.id}
              match={match}
              predictions={predictions}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
