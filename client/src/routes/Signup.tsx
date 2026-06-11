import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Wordmark, Emblem, Avatar, avatarColor } from "../components/ui";

const FLAG_CODES = ["br", "ar", "fr", "es", "gb-eng"];
const TAKEN = ["GoalMachine", "TikiTaka_Tom", "PenaltyQueen", "Messi", "admin"];
const SUGGESTIONS = ["ElTornado", "GroupG_God", "TheGaffer26", "OffsideKing", "GolazoGus"];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [localNickname, setLocalNickname] = useState("");

  const form = useForm({
    defaultValues: {
      nickname: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await signup(value);
        await navigate({ to: "/matches" });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Sign up failed");
      }
    },
  });

  const required = (label: string) => ({
    onChange: ({ value }: { value: string }) =>
      !value || value.trim() === "" ? `${label} is required` : undefined,
  });

  const nicknameValid =
    localNickname.trim().length >= 2 &&
    !TAKEN.includes(localNickname.trim());
  const nicknameTaken = TAKEN.includes(localNickname.trim());

  const nicknameBorderColor = localNickname.length === 0
    ? "var(--line)"
    : nicknameValid
    ? "var(--green)"
    : "var(--red)";

  const inputStyle = {
    width: "100%",
    padding: "13px 15px",
    borderRadius: "var(--r-sm)",
    background: "var(--bg2)",
    border: "1.5px solid var(--line)",
    color: "var(--text)",
    fontSize: 15.5,
    outline: "none",
    fontFamily: "var(--font-display)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12.5,
    fontWeight: 700,
    color: "var(--muted)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    fontFamily: "var(--font-display)",
    marginBottom: 6,
  };

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
        className="signup-hero"
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(60% 55% at 30% 20%, color-mix(in oklab, var(--blue) 18%, transparent), transparent 70%), " +
              "radial-gradient(50% 40% at 80% 80%, color-mix(in oklab, var(--purple) 12%, transparent), transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Wordmark size={1.1} />
        </div>
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
          <div style={{ display: "flex", marginBottom: 36 }}>
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
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(26px, 3.2vw, 40px)",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Join the prediction{" "}
            <span style={{ color: "var(--primary)" }}>arena.</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>
            Pick exact scores, climb the leaderboard, and settle who really knows their football.
          </p>
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
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Progress bar */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 28,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 99,
                  background: i <= step ? "var(--primary)" : "var(--surface2)",
                  transition: "background 0.3s",
                }}
              />
            ))}
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

          {/* ── Step 0: Account info ── */}
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(1);
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 22,
                    letterSpacing: "-0.02em",
                    color: "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  Account info
                </h2>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>Step 1 of 3</p>
              </div>

              {/* First + Last in a row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <form.Field name="first_name" validators={required("First name")}>
                  {(field) => (
                    <div>
                      <label htmlFor={field.name} style={labelStyle}>First name</label>
                      <input
                        id={field.name}
                        style={inputStyle}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <span style={{ color: "var(--red)", fontSize: 12, marginTop: 3, display: "block" }}>
                          {field.state.meta.errors.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="last_name" validators={required("Last name")}>
                  {(field) => (
                    <div>
                      <label htmlFor={field.name} style={labelStyle}>Last name</label>
                      <input
                        id={field.name}
                        style={inputStyle}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <span style={{ color: "var(--red)", fontSize: 12, marginTop: 3, display: "block" }}>
                          {field.state.meta.errors.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) =>
                    !value
                      ? "Email is required"
                      : !/.+@.+\..+/.test(value)
                      ? "Enter a valid email"
                      : undefined,
                }}
              >
                {(field) => (
                  <div style={{ marginBottom: 14 }}>
                    <label htmlFor={field.name} style={labelStyle}>Email</label>
                    <input
                      id={field.name}
                      type="email"
                      style={inputStyle}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span style={{ color: "var(--red)", fontSize: 12, marginTop: 3, display: "block" }}>
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
                    !value || value.length < 8
                      ? "Password must be at least 8 characters"
                      : undefined,
                }}
              >
                {(field) => (
                  <div style={{ marginBottom: 22 }}>
                    <label htmlFor={field.name} style={labelStyle}>Password</label>
                    <input
                      id={field.name}
                      type="password"
                      style={inputStyle}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span style={{ color: "var(--red)", fontSize: 12, marginTop: 3, display: "block" }}>
                        {field.state.meta.errors.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </form.Field>

              <button
                type="submit"
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
                  cursor: "pointer",
                  boxShadow: "0 6px 20px color-mix(in oklab, var(--primary) 45%, transparent)",
                }}
              >
                Continue →
              </button>
            </form>
          )}

          {/* ── Step 1: Nickname ── */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 22,
                    letterSpacing: "-0.02em",
                    color: "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  Choose your nickname
                </h2>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>Step 2 of 3 — This is how others see you</p>
              </div>

              <form.Field
                name="nickname"
                validators={{
                  onChange: ({ value }) =>
                    !value || value.trim().length < 2
                      ? "Nickname must be at least 2 characters"
                      : undefined,
                }}
              >
                {(field) => (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ position: "relative" }}>
                      <input
                        id={field.name}
                        style={{
                          ...inputStyle,
                          fontSize: 22,
                          fontWeight: 800,
                          letterSpacing: "-0.01em",
                          border: `2px solid ${nicknameBorderColor}`,
                          paddingRight: 52,
                        }}
                        value={field.state.value}
                        onChange={(e) => {
                          const val = e.target.value.slice(0, 16);
                          field.handleChange(val);
                          setLocalNickname(val);
                        }}
                        onBlur={field.handleBlur}
                        placeholder="YourNickname"
                        autoFocus
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--muted)",
                          pointerEvents: "none",
                        }}
                      >
                        {field.state.value.length}/16
                      </span>
                    </div>
                    {nicknameTaken && (
                      <span style={{ color: "var(--red)", fontSize: 12.5, marginTop: 4, display: "block" }}>
                        That nickname is already taken
                      </span>
                    )}
                    {field.state.meta.errors.length > 0 && !nicknameTaken && (
                      <span style={{ color: "var(--red)", fontSize: 12.5, marginTop: 4, display: "block" }}>
                        {field.state.meta.errors.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Suggestion chips */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  SUGGESTIONS
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        form.setFieldValue("nickname", s);
                        setLocalNickname(s);
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 999,
                        background: "var(--surface)",
                        border: "1px solid var(--line2)",
                        color: "var(--text)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  style={{
                    padding: "12px 18px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--surface2)",
                    border: "1px solid var(--line)",
                    color: "var(--muted)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => nicknameValid && setStep(2)}
                  disabled={!nicknameValid}
                  style={{
                    flex: 1,
                    padding: "12px 18px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: nicknameValid ? "pointer" : "not-allowed",
                    opacity: nicknameValid ? 1 : 0.5,
                    boxShadow: "0 6px 20px color-mix(in oklab, var(--primary) 45%, transparent)",
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Confirmation ── */}
          {step === 2 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <Emblem size={64} />
              </div>
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
                You're in,{" "}
                <span style={{ color: "var(--primary)" }}>
                  {form.state.values.nickname}
                </span>
                !
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>
                Your account is ready. Let the predictions begin.
              </p>

              {/* User preview card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "var(--surface)",
                  border: "1px solid var(--line2)",
                  borderRadius: "var(--r-lg)",
                  padding: "16px 18px",
                  marginBottom: 24,
                  textAlign: "left",
                }}
              >
                <Avatar
                  nickname={form.state.values.nickname}
                  size={48}
                  you
                />
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: 17,
                      color: "var(--text)",
                    }}
                  >
                    {form.state.values.nickname}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--muted)" }}>
                    {form.state.values.first_name} {form.state.values.last_name}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: `color-mix(in oklab, ${avatarColor(form.state.values.nickname)} 18%, transparent)`,
                      color: avatarColor(form.state.values.nickname),
                      fontSize: 11.5,
                      fontWeight: 800,
                      fontFamily: "var(--font-display)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    New player
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    padding: "12px 18px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--surface2)",
                    border: "1px solid var(--line)",
                    color: "var(--muted)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
                <form.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <button
                      type="button"
                      onClick={() => void form.handleSubmit()}
                      disabled={isSubmitting}
                      style={{
                        flex: 1,
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
                      }}
                    >
                      {isSubmitting ? "Creating account…" : "Enter PitchPool →"}
                    </button>
                  )}
                </form.Subscribe>
              </div>
            </div>
          )}

          <p
            style={{
              textAlign: "center",
              marginTop: 22,
              color: "var(--muted)",
              fontSize: 14,
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .signup-hero { display: none !important; }
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
