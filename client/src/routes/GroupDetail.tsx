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
import { Avatar, FlagBadge, PodiumAvatarStack, ProfileModal } from "../components/ui";

type TableRow = GroupMember & { position: number };
const columnHelper = createColumnHelper<TableRow>();

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
        fontSize: 13,
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
  const [profileModal, setProfileModal] = useState<{ userId: string; nickname: string; avatarUrl?: string | null; points?: number; rank?: number } | null>(null);

  const columns = useMemo(
    () => [
      columnHelper.accessor("position", {
        header: "Pos",
        cell: (info) => (
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--faint)", fontSize: 13 }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("rank", {
        header: "Rank",
        cell: (info) => {
          const rank = info.getValue();
          const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
          return (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: rank === 1 ? "var(--yellow)" : "var(--muted)",
                fontSize: 15,
              }}
            >
              {medals[rank] ?? rank}
            </span>
          );
        },
      }),
      columnHelper.accessor("nickname", {
        header: "Player",
        cell: (info) => {
          const nickname = info.getValue();
          const member = info.row.original;
          const isMe = member.user_id === user?.id;
          return (
            <button
              type="button"
              onClick={() => setProfileModal({ userId: member.user_id, nickname, avatarUrl: member.avatar_url, points: member.points, rank: member.rank })}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
            >
              <Avatar nickname={nickname} size={28} you={isMe} src={member.avatar_url} />
              <strong
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {nickname}
              </strong>
              {isMe && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "var(--primary)",
                    background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                    padding: "1px 7px",
                    borderRadius: 999,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.04em",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  You
                </span>
              )}
            </button>
          );
        },
      }),
      columnHelper.accessor("points", {
        header: scoreMode === "live" ? "Live pts" : "Points",
        cell: (info) => (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--text)",
            }}
          >
            {info.getValue()}
          </span>
        ),
      }),
    ],
    [scoreMode, user?.id],
  );

  const rawMembers = groupQuery.data?.members ?? [];
  const data = useMemo(() => {
    const ranked = rawMembers.map((m) => ({
      ...m,
      points: scoreMode === "live" ? m.live_points : m.points,
    }));
    ranked.sort((a, b) => b.points - a.points);
    let rank = 1;
    return ranked.map((m, i) => {
      if (i > 0 && m.points < ranked[i - 1].points) rank = i + 1;
      return { ...m, rank, position: i + 1 };
    });
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

  const podiumGroups = useMemo(() => {
    const groups: (typeof data[number])[][] = [];
    let lastRank = -1;
    for (const m of data) {
      if (m.rank !== lastRank) {
        if (groups.length >= 3) break;
        groups.push([]);
        lastRank = m.rank;
      }
      groups[groups.length - 1].push(m);
    }
    return groups;
  }, [data]);

  if (groupQuery.isLoading) {
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
        Loading group…
      </div>
    );
  }

  if (groupQuery.isError || !groupQuery.data) {
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
        Group not found.
      </div>
    );
  }

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
  const podiumHeights = [104, 80, 64];
  const podiumOrder = [1, 0, 2];

  return (
    <div>
      {profileModal && (
        <ProfileModal
          userId={profileModal.userId}
          nickname={profileModal.nickname}
          avatarUrl={profileModal.avatarUrl}
          points={profileModal.points}
          rank={profileModal.rank}
          contextLabel="Group rank"
          onClose={() => setProfileModal(null)}
        />
      )}
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          gap: 12,
        }}
      >
        <div>
          <button
            onClick={() => navigate({ to: "/groups" })}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              padding: "0 0 10px",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ← All groups
          </button>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            {group.name}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {group.member_count} member{group.member_count === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={onLeave}
          style={{
            padding: "8px 14px",
            borderRadius: "var(--r-sm)",
            background: "var(--surface2)",
            border: "1px solid var(--line)",
            color: "var(--muted)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Leave group
        </button>
      </div>

      {/* Invite code card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          padding: "16px 20px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase" as const,
              letterSpacing: "0.14em",
              color: "var(--primary)",
              fontFamily: "var(--font-display)",
              marginBottom: 4,
            }}
          >
            Invite your mates
          </div>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            Share this code so friends can join.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.12em",
              color: "var(--text)",
              background: "var(--surface2)",
              border: "1px solid var(--line2)",
              borderRadius: "var(--r-sm)",
              padding: "6px 14px",
            }}
          >
            {group.invite_code}
          </span>
          <button
            onClick={copyCode}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--r-sm)",
              background: copied ? "color-mix(in oklab, var(--green) 14%, transparent)" : "var(--surface2)",
              border: `1px solid ${copied ? "var(--green)" : "var(--line)"}`,
              color: copied ? "var(--green)" : "var(--text)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        <FilterChip
          active={tab === "leaderboard"}
          onClick={() => setTab("leaderboard")}
        >
          Leaderboard
        </FilterChip>
        <FilterChip
          active={tab === "predictions"}
          onClick={() => setTab("predictions")}
        >
          Predictions
        </FilterChip>
      </div>

      {tab === "leaderboard" ? (
        <div>
          {/* Live/Finished toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <FilterChip
                active={scoreMode === "finished"}
                onClick={() => setScoreMode("finished")}
              >
                Finished
              </FilterChip>
              <FilterChip
                active={scoreMode === "live"}
                onClick={() => setScoreMode("live")}
              >
                Live{hasLiveDelta ? " ●" : ""}
              </FilterChip>
            </div>
            <span style={{ color: "var(--muted)", fontSize: 12.5 }}>
              {scoreMode === "live"
                ? "Includes provisional points from in-progress matches."
                : "Official points from finished matches only."}
            </span>
          </div>

          {/* Podium — only once there are real points to rank by */}
          {podiumGroups.length >= 2 && podiumGroups[0][0].points > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: 10,
                marginBottom: 24,
                padding: "24px 16px 0",
              }}
            >
              {podiumOrder.map((pos) => {
                const group = podiumGroups[pos];
                if (!group) return null;
                const height = podiumHeights[pos];
                const medalColors = ["var(--yellow)", "var(--muted)", "var(--orange)"];
                const barColors = [
                  "color-mix(in oklab, var(--yellow) 22%, transparent)",
                  "color-mix(in oklab, var(--muted) 15%, transparent)",
                  "color-mix(in oklab, var(--orange) 18%, transparent)",
                ];
                return (
                  <div
                    key={pos}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      width: pos === 0 ? 120 : 100,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{ cursor: group.length === 1 ? "pointer" : "default" }}
                      onClick={() => group.length === 1 && setProfileModal({ userId: group[0].user_id, nickname: group[0].nickname, avatarUrl: group[0].avatar_url, points: group[0].points, rank: group[0].rank })}
                    >
                      <PodiumAvatarStack
                        members={group}
                        size={pos === 0 ? 42 : 34}
                        currentUserId={user?.id}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: pos === 0 ? 13.5 : 12,
                        color: "var(--text)",
                        textAlign: "center",
                        maxWidth: pos === 0 ? 116 : 96,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {group.length === 1
                        ? group[0].nickname
                        : group.length === 2
                        ? `${group[0].nickname} & ${group[1].nickname}`
                        : `${group[0].nickname} +${group.length - 1}`}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: 12.5,
                        color: medalColors[pos],
                      }}
                    >
                      {group[0].points} pts
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height,
                        background: barColors[pos],
                        border: `1px solid color-mix(in oklab, ${medalColors[pos]} 30%, transparent)`,
                        borderRadius: "8px 8px 0 0",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        paddingTop: 8,
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: 18,
                        color: medalColors[pos],
                      }}
                    >
                      {["🥇", "🥈", "🥉"][pos]}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          textAlign: "left",
                          fontSize: 11,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.06em",
                          color: "var(--faint)",
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--line)",
                          fontWeight: 800,
                          fontFamily: "var(--font-display)",
                          cursor: header.column.getCanSort() ? "pointer" : "default",
                          userSelect: "none" as const,
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {
                          { asc: " ▲", desc: " ▼" }[
                            header.column.getIsSorted() as string
                          ] ?? ""
                        }
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const isMe = row.original.user_id === user?.id;
                  return (
                    <tr
                      key={row.id}
                      style={{
                        background: isMe
                          ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                          : undefined,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid var(--line)",
                            fontSize: 14,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
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

function formatKickoffLocal(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MatchStatusBadge({ match }: { match: Match }) {
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
        }}
      >
        <span className="live-dot" style={{ width: 6, height: 6 }} /> Live
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span
        style={{
          display: "inline-flex",
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
  return (
    <span
      style={{
        display: "inline-flex",
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
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        padding: "18px 20px",
      }}
    >
      {/* Match header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FlagBadge src={match.home_flag} alt={match.home_team} size={24} />
          <strong
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14.5,
            }}
          >
            {match.home_team}
          </strong>
          {(finished || live) ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: 16,
                color: live ? "var(--red)" : "var(--text)",
                padding: "0 4px",
              }}
            >
              {match.home_score ?? 0} – {match.away_score ?? 0}
            </span>
          ) : (
            <span style={{ color: "var(--muted)", fontWeight: 600, padding: "0 4px" }}>vs</span>
          )}
          <strong
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14.5,
            }}
          >
            {match.away_team}
          </strong>
          <FlagBadge src={match.away_flag} alt={match.away_team} size={24} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MatchStatusBadge match={match} />
          <span style={{ color: "var(--muted)", fontSize: 12.5 }}>
            {finished ? "Full time" : live ? "In progress" : formatKickoffLocal(match.kickoff)}
          </span>
        </div>
      </div>

      {predictions.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          No one in this group predicted this match.
        </p>
      ) : (
        <>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 340 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                    color: "var(--faint)",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--line)",
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Player
                </th>
                <th
                  style={{
                    textAlign: "center",
                    width: 80,
                    fontSize: 11,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                    color: "var(--faint)",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--line)",
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <FlagBadge src={match.home_flag} alt={match.home_team} size={14} />
                    {match.home_team}
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "center",
                    width: 80,
                    fontSize: 11,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                    color: "var(--faint)",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--line)",
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <FlagBadge src={match.away_flag} alt={match.away_team} size={14} />
                    {match.away_team}
                  </div>
                </th>
                {showPoints && (
                  <th
                    style={{
                      textAlign: "center",
                      width: 80,
                      fontSize: 11,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.06em",
                      color: "var(--faint)",
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--line)",
                      fontWeight: 800,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {live ? "Live pts" : "Points"}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {hasResult && (
                <tr
                  style={{
                    background: "var(--surface2)",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--line)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--muted)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {live ? "Live score" : "Final result"}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--line)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "var(--text)",
                    }}
                  >
                    {match.home_score}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--line)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "var(--text)",
                    }}
                  >
                    {match.away_score}
                  </td>
                  {showPoints && (
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }} />
                  )}
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
                    style={{
                      background: exact
                        ? "color-mix(in oklab, var(--green) 10%, transparent)"
                        : isMe
                        ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                        : undefined,
                    }}
                  >
                    <td
                      style={{
                        padding: "11px 12px",
                        borderBottom: "1px solid var(--line)",
                        fontSize: 14,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar nickname={p.nickname} size={24} you={isMe} />
                        <strong style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                          {p.nickname}
                        </strong>
                        {isMe && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: "var(--primary)",
                              background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                              padding: "1px 7px",
                              borderRadius: 999,
                              textTransform: "uppercase" as const,
                              letterSpacing: "0.04em",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "11px 12px",
                        borderBottom: "1px solid var(--line)",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      {p.home_score}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "11px 12px",
                        borderBottom: "1px solid var(--line)",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      {p.away_score}
                    </td>
                    {showPoints && (
                      <td
                        style={{
                          textAlign: "center",
                          padding: "11px 12px",
                          borderBottom: "1px solid var(--line)",
                        }}
                      >
                        {finished ? (
                          p.scored ? (
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: exact
                                  ? "var(--green)"
                                  : p.points
                                  ? "var(--yellow)"
                                  : "var(--muted)",
                              }}
                            >
                              {exact ? "Exact +3" : p.points ? `Outcome +${p.points}` : "+0"}
                            </span>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>—</span>
                          )
                        ) : (
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: exact
                                ? "var(--green)"
                                : livePoints
                                ? "var(--yellow)"
                                : "var(--muted)",
                            }}
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
          </div>
          {live && (
            <p style={{ marginTop: 12, fontSize: 12.5, color: "var(--muted)" }}>
              Live — provisional points update with the score. Final points are awarded at full time.
            </p>
          )}
          {!finished && !live && (
            <p style={{ marginTop: 12, fontSize: 12.5, color: "var(--muted)" }}>
              Predictions are locked. Points are awarded once the match finishes.
            </p>
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

  if (isLoading) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: 240,
          color: "var(--muted)",
          fontFamily: "var(--font-display)",
          fontSize: 14,
        }}
      >
        Loading predictions…
      </div>
    );
  }
  if (isError) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: 240,
          color: "var(--muted)",
          fontFamily: "var(--font-display)",
          fontSize: 14,
        }}
      >
        Couldn't load predictions.
      </div>
    );
  }

  const blocks = data ?? [];
  if (blocks.length === 0) {
    return (
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
          Nothing to reveal yet
        </h3>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          Members' predictions appear here once a match's deadline (2 hours before kickoff) has passed.
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
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {options.map((opt) =>
          opt.id === "all" || counts[opt.id] > 0 ? (
            <FilterChip
              key={opt.id}
              active={filter === opt.id}
              onClick={() => setFilter(opt.id)}
            >
              {opt.label} ({counts[opt.id]})
            </FilterChip>
          ) : null,
        )}
      </div>

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
            No {filter} matches
          </h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Try a different filter.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
