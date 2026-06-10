import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="auth-wrap">
      <div className="card card-pad auth-card">
        <div className="brand">
          <span className="brand-badge">26</span> WC Predictions
        </div>
        <p className="auth-sub">Create your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
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
              <div className="field">
                <label htmlFor={field.name}>
                  Nickname <span className="muted">(your display name)</span>
                </label>
                <input
                  id={field.name}
                  className="input"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g. midfield_maestro"
                />
                {field.state.meta.errors.length > 0 && (
                  <span className="field-error">
                    {field.state.meta.errors.join(", ")}
                  </span>
                )}
              </div>
            )}
          </form.Field>

          <div className="form-row">
            <form.Field name="first_name" validators={required("First name")}>
              {(field) => (
                <div className="field">
                  <label htmlFor={field.name}>First name</label>
                  <input
                    id={field.name}
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

            <form.Field name="last_name" validators={required("Last name")}>
              {(field) => (
                <div className="field">
                  <label htmlFor={field.name}>Last name</label>
                  <input
                    id={field.name}
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
                !value || value.length < 8
                  ? "Password must be at least 8 characters"
                  : undefined,
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
                {isSubmitting ? "Creating account…" : "Create account"}
              </button>
            )}
          </form.Subscribe>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
