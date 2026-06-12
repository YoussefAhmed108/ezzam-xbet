import React from "react";

// ── Avatar color helper ────────────────────────────────────────────────────
const COLORS = [
  "#ff3b46",
  "#1d8fff",
  "#16c172",
  "#ffc02e",
  "#9b5cff",
  "#ff7a00",
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return COLORS[h % COLORS.length];
}

// ── Avatar ─────────────────────────────────────────────────────────────────
export function Avatar({
  nickname,
  size = 36,
  color,
  you,
  src,
}: {
  nickname: string;
  size?: number;
  color?: string;
  you?: boolean;
  src?: string | null;
}) {
  const bg = color ?? avatarColor(nickname);
  const initials = nickname.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${bg}, color-mix(in oklab, ${bg} 60%, #000))`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: size * 0.38,
        color: "#fff",
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        boxShadow: you
          ? `0 0 0 2.5px var(--bg2), 0 0 0 4.5px var(--primary)`
          : undefined,
        letterSpacing: "-0.01em",
      }}
      aria-label={nickname}
    >
      {src ? (
        <img
          src={src}
          alt={nickname}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", position: "absolute", inset: 0 }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ── PodiumAvatarStack ──────────────────────────────────────────────────────
export function PodiumAvatarStack({
  members,
  size,
  currentUserId,
}: {
  members: { user_id: string; nickname: string; avatar_url?: string | null }[];
  size: number;
  currentUserId?: string;
}) {
  const MAX = 3;
  const visible = members.slice(0, MAX);
  const overflow = members.length - MAX;
  const overlap = Math.round(size * 0.28);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      {visible.map((m, i) => (
        <div
          key={m.user_id}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            zIndex: visible.length - i,
            position: "relative",
            borderRadius: "50%",
            boxShadow: "0 0 0 2.5px var(--bg2)",
          }}
        >
          <Avatar nickname={m.nickname} size={size} you={m.user_id === currentUserId} src={m.avatar_url} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            marginLeft: -overlap,
            zIndex: 0,
            position: "relative",
            width: size,
            height: size,
            borderRadius: "50%",
            boxShadow: "0 0 0 2.5px var(--bg2)",
            background: "var(--surface2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: Math.round(size * 0.3),
            color: "var(--muted)",
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ── FlagBadge ──────────────────────────────────────────────────────────────
export function FlagBadge({
  src,
  alt,
  size = 32,
}: {
  src: string | null;
  alt: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: "var(--surface2)",
        boxShadow: "0 0 0 2px var(--line2)",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : null}
    </div>
  );
}

// ── Emblem ─────────────────────────────────────────────────────────────────
// The World Cup trophy mark (portrait, transparent PNG served from /logo.png).
// `size` controls the rendered height; width scales to preserve aspect ratio.
export function Emblem({ size = 30 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="PitchPool"
      style={{
        height: size * 1.2,
        width: "auto",
        display: "block",
        flexShrink: 0,
        objectFit: "contain",
      }}
    />
  );
}

// ── Wordmark ───────────────────────────────────────────────────────────────
export function Wordmark({ size = 1 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10 * size,
        userSelect: "none",
      }}
    >
      <Emblem size={30 * size} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 16 * size,
            letterSpacing: "0.04em",
            color: "var(--text)",
          }}
        >
          PITCH
          <span style={{ color: "var(--primary)" }}>POOL</span>
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 9 * size,
            letterSpacing: "0.08em",
            color: "var(--muted)",
            textTransform: "uppercase",
          }}
        >
          World Cup '26
        </span>
      </div>
    </div>
  );
}

// ── Pill ───────────────────────────────────────────────────────────────────
export function Pill({
  children,
  color,
  bg,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 800,
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
        fontFamily: "var(--font-display)",
        color: color ?? "var(--text)",
        background: bg ?? "var(--surface2)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ── SectionTitle ───────────────────────────────────────────────────────────
export function SectionTitle({
  kicker,
  title,
  right,
}: {
  kicker?: string;
  title: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <div>
        {kicker && (
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
            {kicker}
          </div>
        )}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: "-0.02em",
            color: "var(--text)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}
