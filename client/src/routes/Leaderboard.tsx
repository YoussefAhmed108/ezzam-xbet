import { useMemo, useState } from "react";
import { useGlobalLeaderboard } from "../lib/queries";
import { useAuth } from "../lib/auth";
import type { LeaderboardEntry } from "../lib/types";
import { Avatar, PodiumAvatarStack, SectionTitle, Pill } from "../components/ui";

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

const podiumHeights = [104, 80, 64];
const podiumOrder = [1, 0, 2];
const medalColors = ["var(--yellow)", "var(--muted)", "var(--orange)"];
const barColors = [
  "color-mix(in oklab, var(--yellow) 22%, transparent)",
  "color-mix(in oklab, var(--muted) 15%, transparent)",
  "color-mix(in oklab, var(--orange) 18%, transparent)",
];

export default function Leaderboard() {
  const { data, isLoading, isError } = useGlobalLeaderboard();
  const { user } = useAuth();
  const [scoreMode, setScoreMode] = useState<"finished" | "live">("finished");

  const ranked = useMemo(() => {
    const list = (data ?? []).map((m) => ({
      ...m,
      points: scoreMode === "live" ? m.live_points : m.points,
    }));
    list.sort((a, b) => b.points - a.points);
    let rank = 1;
    return list.map((m, i) => {
      if (i > 0 && m.points < list[i - 1].points) rank = i + 1;
      return { ...m, rank };
    });
  }, [data, scoreMode]);

  const hasLiveDelta = (data ?? []).some((m) => m.live_points !== m.points);

  const podiumGroups = useMemo(() => {
    const groups: (typeof ranked[number])[][] = [];
    let lastRank = -1;
    for (const m of ranked) {
      if (m.rank !== lastRank) {
        if (groups.length >= 3) break;
        groups.push([]);
        lastRank = m.rank;
      }
      groups[groups.length - 1].push(m);
    }
    return groups;
  }, [ranked]);

  if (isLoading) {
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
        Loading leaderboard…
      </div>
    );
  }

  if (isError) {
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
        Couldn't load leaderboard.
      </div>
    );
  }

  const myEntry = ranked.find((m) => m.user_id === user?.id);

  return (
    <div>
      <SectionTitle
        kicker="ALL PLAYERS"
        title="Global Leaderboard"
        right={
          myEntry ? (
            <Pill
              color="var(--primary)"
              bg="color-mix(in oklab, var(--primary) 14%, transparent)"
              style={{ fontSize: 12, fontWeight: 800 }}
            >
              You #{myEntry.rank}
            </Pill>
          ) : undefined
        }
      />

      {/* Finished / Live toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
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

      {/* Podium — only once there are real points */}
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
                <PodiumAvatarStack
                  members={group}
                  size={pos === 0 ? 42 : 34}
                  currentUserId={user?.id}
                />
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
      {ranked.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            No players yet.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["#", "Player", scoreMode === "live" ? "Live pts" : "Points"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Player" ? "left" : "center",
                        fontSize: 11,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                        color: "var(--faint)",
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--line)",
                        fontWeight: 800,
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {ranked.map((member: LeaderboardEntry) => {
                const isMe = member.user_id === user?.id;
                const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
                return (
                  <tr
                    key={member.user_id}
                    style={{
                      background: isMe
                        ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                        : undefined,
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--line)",
                        textAlign: "center",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: member.rank === 1 ? "var(--yellow)" : "var(--muted)",
                        fontSize: 15,
                      }}
                    >
                      {medals[member.rank] ?? member.rank}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--line)",
                        fontSize: 14,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar nickname={member.nickname} size={28} you={isMe} src={isMe ? user?.avatar_url : undefined} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong
                              style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                                fontSize: 14,
                                color: "var(--text)",
                              }}
                            >
                              {member.nickname}
                            </strong>
                            {isMe && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: "var(--primary)",
                                  background:
                                    "color-mix(in oklab, var(--primary) 14%, transparent)",
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
                          {(member.first_name || member.last_name) && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--muted)",
                                fontFamily: "var(--font-display)",
                                fontWeight: 500,
                                marginTop: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {[member.first_name, member.last_name].filter(Boolean).join(" ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--line)",
                        textAlign: "center",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "var(--text)",
                      }}
                    >
                      {member.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
