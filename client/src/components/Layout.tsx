import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "../lib/auth";
import { Avatar, Wordmark } from "./ui";

const NAV_ITEMS = [
  { to: "/matches", label: "Predict", icon: "matches" as const },
  { to: "/groups", label: "Groups", icon: "groups" as const },
  { to: "/leaderboard", label: "Rankings", icon: "leaderboard" as const },
  { to: "/profile", label: "Profile", icon: "profile" as const },
];

function NavIcon({ icon, active }: { icon: "matches" | "groups" | "leaderboard" | "profile"; active: boolean }) {
  const color = active ? "var(--primary)" : "var(--muted)";
  if (icon === "matches") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 9l2.6 1.9-1 3h-3.2l-1-3z" />
      </svg>
    );
  }
  if (icon === "groups") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="3.4" />
        <path d="M3.5 19a5.5 5.5 0 0111 0" />
        <path d="M16 6.2A3.4 3.4 0 0118 12.6M16.5 14a5.5 5.5 0 014 5" />
      </svg>
    );
  }
  if (icon === "leaderboard") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="14" width="4" height="8" rx="1" />
        <rect x="10" y="9" width="4" height="13" rx="1" />
        <rect x="18" y="4" width="4" height="18" rx="1" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0115 0" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const onLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <div className="app-root" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        style={{
          width: "var(--sidebar-w)",
          minWidth: "var(--sidebar-w)",
          background: "var(--bg2)",
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 20,
          overflowY: "auto",
        }}
        className="sidebar-desktop"
      >
        {/* Wordmark */}
        <div style={{ padding: "22px 20px 18px" }}>
          <Link to="/matches" style={{ textDecoration: "none" }}>
            <Wordmark />
          </Link>
        </div>

        <div
          style={{
            width: "calc(100% - 32px)",
            margin: "0 16px",
            height: 1,
            background: "var(--line)",
          }}
        />

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--text)" : "var(--muted)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "background 0.12s, color 0.12s",
                  boxShadow: active ? "inset 0 0 0 1px var(--line2)" : undefined,
                }}
              >
                <NavIcon icon={item.icon} active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User card at bottom */}
        {user && (
          <div style={{ padding: "12px 10px", borderTop: "1px solid var(--line)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: "var(--r-sm)",
                background: "var(--surface)",
                border: "1px solid var(--line)",
              }}
            >
              <Avatar nickname={user.nickname} size={34} you />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 13.5,
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.nickname}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--green)",
                    fontWeight: 700,
                  }}
                >
                  {user.total_points} pts
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: "4px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.12s",
                }}
              >
                ↩
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile Top Header ── */}
      <header
        className="mobile-header"
        style={{
          display: "none",
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--bg2)",
          borderBottom: "1px solid var(--line)",
          padding: "0 16px",
          height: 56,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Wordmark size={0.9} />
        {user && (
          <span
            style={{
              background: "color-mix(in oklab, var(--green) 18%, transparent)",
              color: "var(--green)",
              padding: "3px 10px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "var(--font-mono)",
            }}
          >
            {user.total_points} pts
          </span>
        )}
      </header>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          marginLeft: "var(--sidebar-w)",
          padding: "32px 28px 80px",
          maxWidth: "calc(var(--content-max) + var(--sidebar-w))",
          width: "100%",
          overflowY: "auto",
          height: "100vh",
        }}
        className="main-content"
      >
        <div style={{ maxWidth: "var(--content-max)", margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="mobile-bottom-nav"
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: "rgba(14,18,25,0.88)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid var(--line)",
          padding: "8px 0 env(safe-area-inset-bottom, 8px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          {NAV_ITEMS.map((item) => {
            const active = currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "6px 16px",
                  color: active ? "var(--primary)" : "var(--muted)",
                  textDecoration: "none",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                <NavIcon icon={item.icon} active={active} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Responsive styles ── */}
      <style>{`
        @media (max-width: 900px) {
          body { overflow: auto !important; }
          .app-root { flex-direction: column !important; min-height: 100vh; }
          .sidebar-desktop { display: none !important; }
          .mobile-header   { display: flex !important; }
          .mobile-bottom-nav { display: block !important; }
          .main-content {
            margin-left: 0 !important;
            height: auto !important;
            overflow: visible !important;
            max-width: 100% !important;
            padding: 16px 14px 96px !important;
          }
        }
      `}</style>
    </div>
  );
}
