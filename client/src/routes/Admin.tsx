import { useState } from "react";
import { useAdminUsers, useAdminUserPredictions, useAdminSetPrediction } from "../lib/queries";
import { Avatar, SectionTitle } from "../components/ui";
import type { AdminUser, AdminMatchPrediction } from "../lib/types";

type Filter = "all" | "scored" | "upcoming";

function PredictionRow({
  entry,
  userId,
}: {
  entry: AdminMatchPrediction;
  userId: string;
}) {
  const { match, prediction } = entry;
  const [home, setHome] = useState(String(prediction?.home_score ?? ""));
  const [away, setAway] = useState(String(prediction?.away_score ?? ""));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useAdminSetPrediction();

  const isDirty =
    String(prediction?.home_score ?? "") !== home ||
    String(prediction?.away_score ?? "") !== away;

  const handleSave = async () => {
    const h = parseInt(home);
    const a = parseInt(away);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Invalid scores");
      return;
    }
    setError(null);
    try {
      await mutation.mutateAsync({ userId, matchId: match.id, homeScore: h, awayScore: a });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const ptColor =
    prediction?.points === 3
      ? "var(--green)"
      : prediction?.points === 1
      ? "var(--yellow)"
      : prediction?.scored
      ? "var(--muted)"
      : "var(--faint)";

  const inputStyle: React.CSSProperties = {
    width: 36,
    padding: "5px 4px",
    borderRadius: 6,
    border: "1.5px solid var(--line)",
    background: "var(--bg2)",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    fontSize: 14,
    textAlign: "center",
    outline: "none",
    minWidth: 0,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        borderBottom: "1px solid var(--line)",
        background: saved ? "color-mix(in oklab, var(--green) 6%, transparent)" : undefined,
        transition: "background 0.3s",
      }}
    >
      {/* Teams + result */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 12.5,
          color: "var(--text)",
          flexWrap: "wrap",
        }}>
          {match.home_flag && <img src={match.home_flag} alt="" style={{ width: 13, height: 13, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "35%" }}>{match.home_team}</span>
          <span style={{ color: "var(--faint)", flexShrink: 0, fontSize: 10 }}>vs</span>
          {match.away_flag && <img src={match.away_flag} alt="" style={{ width: 13, height: 13, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "35%" }}>{match.away_team}</span>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span>{new Date(match.kickoff).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          {match.home_score != null && (
            <span style={{ color: "var(--muted)", fontWeight: 700 }}>
              {match.home_score}–{match.away_score}
            </span>
          )}
        </div>
      </div>

      {/* Pick inputs */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <input
          style={inputStyle}
          value={home}
          onChange={(e) => { setHome(e.target.value); setSaved(false); }}
          min={0}
          type="number"
        />
        <span style={{ color: "var(--faint)", fontWeight: 700, fontSize: 12 }}>–</span>
        <input
          style={inputStyle}
          value={away}
          onChange={(e) => { setAway(e.target.value); setSaved(false); }}
          min={0}
          type="number"
        />
      </div>

      {/* Points */}
      <div style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 800,
        fontSize: 13,
        color: ptColor,
        minWidth: 22,
        textAlign: "center",
        flexShrink: 0,
      }}>
        {prediction?.scored ? (prediction.points === 3 ? "+3" : prediction.points === 1 ? "+1" : "0") : "—"}
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || mutation.isPending}
        style={{
          padding: "5px 10px",
          borderRadius: 6,
          border: "none",
          background: isDirty && !mutation.isPending ? "var(--primary)" : "var(--surface2)",
          color: isDirty && !mutation.isPending ? "#fff" : "var(--faint)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 12,
          cursor: isDirty && !mutation.isPending ? "pointer" : "not-allowed",
          flexShrink: 0,
          transition: "all 0.15s",
          minWidth: 42,
        }}
      >
        {mutation.isPending ? "…" : saved ? "✓" : "Save"}
      </button>

      {error && (
        <span style={{ color: "var(--red)", fontSize: 10, flexShrink: 0 }}>{error}</span>
      )}
    </div>
  );
}

function UserPanel({
  selected,
  onSelect,
  users,
  search,
  setSearch,
  className,
}: {
  selected: AdminUser | null;
  onSelect: (u: AdminUser) => void;
  users: AdminUser[];
  search: string;
  setSearch: (s: string) => void;
  className?: string;
}) {
  const filtered = users.filter(
    (u) =>
      u.nickname.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className={className}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
        <input
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1.5px solid var(--line)",
            background: "var(--bg2)",
            color: "var(--text)",
            fontFamily: "var(--font-display)",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {filtered.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onSelect(u)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: selected?.id === u.id
                ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                : "none",
              border: "none",
              borderBottom: "1px solid var(--line)",
              cursor: "pointer",
              textAlign: "left",
            } as React.CSSProperties}
          >
            <Avatar nickname={u.nickname} size={30} src={u.avatar_url} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {u.nickname}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--green)",
                fontWeight: 700,
              }}>
                {u.total_points} pts
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: predictions = [], isLoading: predsLoading } = useAdminUserPredictions(
    selectedUser?.id ?? null,
  );

  const filtered = predictions.filter((e) => {
    if (filter === "scored") return e.prediction?.scored;
    if (filter === "upcoming") return !e.prediction?.scored;
    return true;
  });

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${predictions.length})` },
    { key: "scored", label: `Scored (${predictions.filter((e) => e.prediction?.scored).length})` },
    { key: "upcoming", label: `Upcoming (${predictions.filter((e) => !e.prediction?.scored).length})` },
  ];

  const predictionsPanel = selectedUser ? (
    <>
      {/* Selected user header */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        padding: "12px 14px",
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        {/* Back button — visible only on mobile via CSS */}
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => setSelectedUser(null)}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            padding: "4px 6px 4px 0",
            display: "none",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <Avatar nickname={selectedUser.nickname} size={36} src={selectedUser.avatar_url} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedUser.nickname}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(" ")} · {selectedUser.email}
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 16, color: "var(--primary)", flexShrink: 0 }}>
          {users.find((u) => u.id === selectedUser.id)?.total_points ?? selectedUser.total_points} pts
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: filter === c.key ? "none" : "1px solid var(--line)",
              background: filter === c.key ? "var(--primary)" : "var(--surface2)",
              color: filter === c.key ? "#fff" : "var(--muted)",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              cursor: "pointer",
              boxShadow: filter === c.key ? "0 4px 14px color-mix(in oklab, var(--primary) 35%, transparent)" : undefined,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Matches list */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        {predsLoading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontFamily: "var(--font-display)", fontSize: 14 }}>
            Loading predictions…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontFamily: "var(--font-display)", fontSize: 14 }}>
            No matches in this category.
          </div>
        ) : (
          filtered.map((entry) => (
            <PredictionRow key={entry.match.id} entry={entry} userId={selectedUser.id} />
          ))
        )}
      </div>
    </>
  ) : (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-lg)",
      padding: "48px 24px",
      textAlign: "center",
      color: "var(--muted)",
      fontFamily: "var(--font-display)",
      fontSize: 14,
    }}>
      Select a user to edit their predictions
    </div>
  );

  return (
    <div>
      <SectionTitle kicker="ADMIN ONLY" title="Admin Dashboard" />

      {usersLoading ? (
        <div style={{ color: "var(--muted)", fontFamily: "var(--font-display)", fontSize: 14 }}>Loading users…</div>
      ) : (
        <>
          {/* Desktop: side-by-side. Mobile: one panel at a time. */}
          <div className="admin-layout">
            <UserPanel
              className={`admin-user-panel${selectedUser ? " admin-user-panel--hidden" : ""}`}
              users={users}
              selected={selectedUser}
              onSelect={(u) => { setSelectedUser(u); setFilter("all"); }}
              search={search}
              setSearch={setSearch}
            />
            <div className={`admin-preds-panel${!selectedUser ? " admin-preds-panel--hidden" : ""}`}>
              {predictionsPanel}
            </div>
          </div>

          <style>{`
            /* Desktop layout */
            .admin-layout {
              display: flex;
              gap: 16px;
              align-items: flex-start;
            }
            .admin-user-panel {
              width: 260px;
              flex-shrink: 0;
              align-self: flex-start;
              max-height: calc(100vh - 140px);
            }
            .admin-preds-panel {
              flex: 1;
              min-width: 0;
            }

            /* Mobile: show only one panel at a time */
            @media (max-width: 700px) {
              .admin-layout {
                display: block;
              }
              .admin-user-panel {
                width: 100%;
                max-height: none;
              }
              .admin-user-panel--hidden {
                display: none !important;
              }
              .admin-preds-panel--hidden {
                display: none !important;
              }
              .admin-back-btn {
                display: flex !important;
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
