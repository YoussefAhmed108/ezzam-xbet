import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { useMatches, useMyPredictions } from "../lib/queries";
import { Avatar, avatarColor, SectionTitle } from "../components/ui";
import { useNavigate } from "@tanstack/react-router";

const AVATAR_COLORS = [
  "#ff3b46",
  "#1d8fff",
  "#16c172",
  "#ffc02e",
  "#9b5cff",
  "#ff7a00",
];

const SCORING_ROWS = [
  {
    pts: "+3",
    color: "var(--green)",
    label: "Exact scoreline",
    desc: "Right winner AND exact score",
  },
  {
    pts: "+1",
    color: "var(--yellow)",
    label: "Right result",
    desc: "Correct winner or draw only",
  },
  {
    pts: "+0",
    color: "var(--muted)",
    label: "Missed",
    desc: "Wrong outcome",
  },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const predictionsQuery = useMyPredictions();
  const matchesQuery = useMatches();

  // Local editable state
  const [localNickname, setLocalNickname] = useState(user?.nickname ?? "");
  const [localFirstName, setLocalFirstName] = useState(user?.first_name ?? "");
  const [localLastName, setLocalLastName] = useState(user?.last_name ?? "");
  const [localEmail, setLocalEmail] = useState(user?.email ?? "");
  const [selectedColor, setSelectedColor] = useState<string>(
    user ? avatarColor(user.nickname) : AVATAR_COLORS[1],
  );

  const stats = useMemo(() => {
    const preds = predictionsQuery.data ?? [];
    const scored = preds.filter((p) => p.scored);
    const exact = scored.filter((p) => p.points === 3).length;
    const outcome = scored.filter((p) => p.points === 1).length;
    const total = matchesQuery.data?.length ?? 0;
    return {
      submitted: preds.length,
      totalMatches: total,
      exact,
      outcome,
      scored: scored.length,
    };
  }, [predictionsQuery.data, matchesQuery.data]);

  if (!user) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "var(--r-sm)",
    background: "var(--bg2)",
    border: "1.5px solid var(--line)",
    color: "var(--text)",
    fontSize: 15,
    outline: "none",
    fontFamily: "var(--font-display)",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--muted)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontFamily: "var(--font-display)",
    marginBottom: 6,
  };

  const onLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <div>
      <SectionTitle kicker="ACCOUNT" title="Profile & settings" />

      {/* ── Card 1: User info ── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          padding: "22px 24px",
          marginBottom: 16,
        }}
      >
        {/* Avatar + identity */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 24,
            paddingBottom: 22,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <Avatar
            nickname={localNickname || user.nickname}
            size={66}
            color={selectedColor}
            you
          />
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "-0.02em",
                color: "var(--text)",
                marginBottom: 3,
              }}
            >
              {localNickname || user.nickname}
            </h1>
            <div style={{ fontSize: 13.5, color: "var(--muted)" }}>
              {localFirstName} {localLastName}
            </div>
            <div style={{ fontSize: 13, color: "var(--faint)", marginTop: 2 }}>
              {localEmail}
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px 18px",
            marginBottom: 18,
          }}
        >
          <div>
            <label style={labelStyle}>Nickname</label>
            <input
              style={inputStyle}
              value={localNickname}
              onChange={(e) => setLocalNickname(e.target.value)}
              maxLength={16}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>First name</label>
            <input
              style={inputStyle}
              value={localFirstName}
              onChange={(e) => setLocalFirstName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Last name</label>
            <input
              style={inputStyle}
              value={localLastName}
              onChange={(e) => setLocalLastName(e.target.value)}
            />
          </div>
        </div>

        {/* Avatar color picker */}
        <div>
          <div style={labelStyle}>Avatar colour</div>
          <div style={{ display: "flex", gap: 8 }}>
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: c,
                  border: selectedColor === c
                    ? "3px solid var(--text)"
                    : "3px solid transparent",
                  cursor: "pointer",
                  outline: selectedColor === c
                    ? "2px solid var(--primary)"
                    : undefined,
                  outlineOffset: 2,
                  transition: "outline 0.1s, border-color 0.1s",
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Card 2: Scoring guide ── */}
      <div
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          padding: "20px 24px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase" as const,
            letterSpacing: "0.12em",
            color: "var(--primary)",
            fontFamily: "var(--font-display)",
            marginBottom: 14,
          }}
        >
          How scoring works
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {SCORING_ROWS.map((row, i) => (
            <div
              key={row.pts}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "13px 0",
                borderBottom:
                  i < SCORING_ROWS.length - 1 ? "1px solid var(--line)" : undefined,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 20,
                  color: row.color,
                  minWidth: 42,
                  textAlign: "center",
                }}
              >
                {row.pts}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 14.5,
                    color: "var(--text)",
                    marginBottom: 2,
                  }}
                >
                  {row.label}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{row.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "10px 14px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-sm)",
            fontSize: 13,
            color: "var(--muted)",
            fontFamily: "var(--font-display)",
          }}
        >
          ⏱ Predictions lock 2 hours before each kick-off.
        </div>
      </div>

      {/* ── Prediction stats ── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase" as const,
            letterSpacing: "0.12em",
            color: "var(--primary)",
            fontFamily: "var(--font-display)",
            marginBottom: 16,
          }}
        >
          Prediction stats
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              label: "Total points",
              value: String(user.total_points),
              color: "var(--primary)",
            },
            {
              label: "Predictions made",
              value: `${stats.submitted} / ${stats.totalMatches}`,
              color: "var(--text)",
            },
            {
              label: "Exact results",
              value: String(stats.exact),
              color: "var(--green)",
            },
            {
              label: "Correct outcomes",
              value: String(stats.outcome),
              color: "var(--yellow)",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-sm)",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 22,
                  color: stat.color,
                  lineHeight: 1,
                  marginBottom: 5,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted)",
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.04em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        style={{
          padding: "10px 20px",
          borderRadius: "var(--r-sm)",
          background: "transparent",
          border: "1.5px solid var(--red)",
          color: "var(--red)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <span>↩</span> Log out
      </button>
    </div>
  );
}
