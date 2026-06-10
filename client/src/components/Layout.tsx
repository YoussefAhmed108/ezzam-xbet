import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../lib/auth";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/matches" className="brand">
            <span className="brand-badge">26</span> WC Predictions
          </Link>
          <nav className="nav">
            <Link to="/matches" activeProps={{ className: "active" }}>
              Matches
            </Link>
            <Link to="/groups" activeProps={{ className: "active" }}>
              Groups
            </Link>
            <Link to="/profile" activeProps={{ className: "active" }}>
              Profile
            </Link>
          </nav>
          <div className="topbar-right">
            {user && (
              <span className="user-chip">
                <span className="points-pill">{user.total_points} pts</span>
                <strong>{user.nickname}</strong>
              </span>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
