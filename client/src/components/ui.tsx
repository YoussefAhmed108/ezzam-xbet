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
}: {
  nickname: string;
  size?: number;
  color?: string;
  you?: boolean;
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
        boxShadow: you
          ? `0 0 0 2.5px var(--bg2), 0 0 0 4.5px var(--primary)`
          : undefined,
        letterSpacing: "-0.01em",
      }}
      aria-label={nickname}
    >
      {initials}
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
export function Emblem({ size = 30 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `conic-gradient(
          var(--primary) 0deg 90deg,
          var(--purple) 90deg 180deg,
          var(--red) 180deg 270deg,
          var(--green) 270deg 360deg
        )`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size * 0.58,
          height: size * 0.58,
          borderRadius: "50%",
          background: "var(--bg2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: size * 0.26,
          color: "var(--text)",
          letterSpacing: "-0.02em",
        }}
      >
        26
      </div>
    </div>
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
