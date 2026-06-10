import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

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
    <div className="auth-wrap">
      <div className="card card-pad auth-card">
        <div className="brand">
          <span className="brand-badge">26</span> WC Predictions
        </div>
        <p className="auth-sub">Sign in to make your picks</p>

        {error && <div className="alert alert-error">{error}</div>}

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
              <div className="field">
                <label htmlFor={field.name}>Email</label>
                <input
                  id={field.name}
                  type="email"
                  className="input"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <span className="field-error">
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
              <div className="field">
                <label htmlFor={field.name}>Password</label>
                <input
                  id={field.name}
                  type="password"
                  className="input"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <span className="field-error">
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
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            )}
          </form.Subscribe>
        </form>

        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
