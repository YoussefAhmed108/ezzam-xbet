import { useMemo, useRef, useState } from "react";
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
    pts: "+1",
    color: "var(--primary)",
    label: "Penalty bonus",
    desc: "Knockout: correct penalty score",
  },
  {
    pts: "+0",
    color: "var(--muted)",
    label: "Missed",
    desc: "Wrong outcome",
  },
];

export default function Profile() {
  const { user, logout, updateProfile, uploadAvatar } = useAuth();
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

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const [avatarHovered, setAvatarHovered] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      await uploadAvatar(file);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const isDirty =
    !!user &&
    (localNickname.trim() !== user.nickname ||
      localEmail.trim() !== user.email ||
      localFirstName.trim() !== user.first_name ||
      localLastName.trim() !== user.last_name);

  const canSave =
    isDirty &&
    !saving &&
    localNickname.trim().length >= 2 &&
    localEmail.trim().length > 0 &&
    localFirstName.trim().length > 0 &&
    localLastName.trim().length > 0;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      await updateProfile({
        nickname: localNickname.trim(),
        email: localEmail.trim(),
        first_name: localFirstName.trim(),
        last_name: localLastName.trim(),
      });
      setSaveOk(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Couldn't save changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const preds = predictionsQuery.data ?? [];
    const scored = preds.filter((p) => p.scored);
    const exact = scored.filter((p) => (p.points ?? 0) >= 3).length;
    const outcome = scored.filter((p) => { const pts = p.points ?? 0; return pts >= 1 && pts < 3; }).length;
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
          <div
            style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
            onMouseEnter={() => setAvatarHovered(true)}
            onMouseLeave={() => setAvatarHovered(false)}
            onClick={() => avatarInputRef.current?.click()}
            title="Change photo"
          >
            <Avatar
              nickname={localNickname || user.nickname}
              size={66}
              color={selectedColor}
              you
              src={user.avatar_url}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: avatarHovered || avatarUploading ? 1 : 0,
              transition: "opacity 0.15s",
              pointerEvents: "none",
            }}>
              {avatarUploading ? (
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>…</span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>
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

        {/* Save row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            marginTop: 22,
            paddingTop: 20,
            borderTop: "1px solid var(--line)",
          }}
        >
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            style={{
              padding: "11px 22px",
              borderRadius: "var(--r-sm)",
              background: canSave ? "var(--primary)" : "var(--surface2)",
              border: "none",
              color: canSave ? "#fff" : "var(--faint)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              cursor: canSave ? "pointer" : "not-allowed",
              boxShadow: canSave
                ? "0 4px 14px color-mix(in oklab, var(--primary) 40%, transparent)"
                : undefined,
              transition: "all 0.15s",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saveOk && !isDirty && (
            <span
              style={{
                color: "var(--green)",
                fontSize: 13.5,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              ✓ Saved
            </span>
          )}
          {saveError && (
            <span
              style={{
                color: "var(--red)",
                fontSize: 13.5,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              {saveError}
            </span>
          )}
          {avatarError && (
            <span
              style={{
                color: "var(--red)",
                fontSize: 13.5,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              Photo: {avatarError}
            </span>
          )}
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
