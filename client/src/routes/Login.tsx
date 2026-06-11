import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Wordmark } from "../components/ui";

const FLAG_CODES = ["br", "ar", "fr", "es", "gb-eng"];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await login(value.email, value.password);
        await navigate({ to: "/matches" });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Login failed");
      }
    },
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
        overflow: "hidden",
      }}
    >
      {/* ── Left hero column ── */}
      <div
        style={{
          background: "linear-gradient(160deg, var(--bg2), var(--bg))",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "36px 48px",
          overflow: "hidden",
        }}
        className="login-hero"
      >
        {/* Radial glow overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(60% 55% at 30% 20%, color-mix(in oklab, var(--blue) 18%, transparent), transparent 70%), " +
              "radial-gradient(50% 40% at 80% 80%, color-mix(in oklab, var(--green) 12%, transparent), transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Wordmark */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Wordmark size={1.1} />
        </div>

        {/* Center content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Stacked flags */}
          <div
            style={{
              display: "flex",
              marginBottom: 36,
            }}
          >
            {FLAG_CODES.map((code, i) => (
              <div
                key={code}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2.5px solid var(--bg)",
                  marginLeft: i === 0 ? 0 : -14,
                  boxShadow: "var(--shadow)",
                  zIndex: FLAG_CODES.length - i,
                  background: "var(--surface2)",
                }}
              >
                <img
                  src={`https://flagcdn.com/w80/${code}.png`}
                  alt={code}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>

          {/* Hero headline */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(28px, 3.5vw, 44px)",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 32,
            }}
          >
            Out-predict your mates.{" "}
            <span style={{ color: "var(--primary)" }}>All summer long.</span>
          </h1>

          {/* Stat tiles */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { pts: "3 pts", label: "Exact score" },
              { pts: "1 pt", label: "Right result" },
              { pts: "104", label: "Matches" },
            ].map((stat) => (
              <div
                key={stat.pts}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r)",
                  padding: "12px 18px",
                  minWidth: 100,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "var(--primary)",
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {stat.pts}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form column ── */}
      <div
        style={{
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: "-0.02em",
                color: "var(--text)",
                marginBottom: 6,
              }}
            >
              Welcome back
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Sign in to make your picks
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "color-mix(in oklab, var(--red) 14%, transparent)",
                color: "var(--red)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
                fontSize: 13.5,
                marginBottom: 16,
                border: "1px solid color-mix(in oklab, var(--red) 30%, transparent)",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
          >
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Email is required" : undefined,
              }}
            >
              {(field) => (
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor={field.name}
                    style={{
                      display: "block",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "var(--muted)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-display)",
                      marginBottom: 6,
                    }}
                  >
                    Email
                  </label>
                  <input
                    id={field.name}
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: "var(--r-sm)",
                      background: "var(--bg2)",
                      border: `1.5px solid ${field.state.meta.errors.length > 0 ? "var(--red)" : "var(--line)"}`,
                      color: "var(--text)",
                      fontSize: 15.5,
                      outline: "none",
                      fontFamily: "var(--font-display)",
                    }}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span style={{ color: "var(--red)", fontSize: 12.5, marginTop: 4, display: "block" }}>
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Password is required" : undefined,
              }}
            >
              {(field) => (
                <div style={{ marginBottom: 22 }}>
                  <label
                    htmlFor={field.name}
                    style={{
                      display: "block",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "var(--muted)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-display)",
                      marginBottom: 6,
                    }}
                  >
                    Password
                  </label>
                  <input
                    id={field.name}
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    style={{
                      width: "100%",
                      padding: "13px 15px",
                      borderRadius: "var(--r-sm)",
                      background: "var(--bg2)",
                      border: `1.5px solid ${field.state.meta.errors.length > 0 ? "var(--red)" : "var(--line)"}`,
                      color: "var(--text)",
                      fontSize: 15.5,
                      outline: "none",
                      fontFamily: "var(--font-display)",
                    }}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span style={{ color: "var(--red)", fontSize: 12.5, marginTop: 4, display: "block" }}>
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1,
                    boxShadow: "0 6px 20px color-mix(in oklab, var(--primary) 45%, transparent)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              )}
            </form.Subscribe>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              color: "var(--muted)",
              fontSize: 14,
            }}
          >
            New here?{" "}
            <Link
              to="/signup"
              style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 700px) {
          .login-hero { display: none !important; }
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
