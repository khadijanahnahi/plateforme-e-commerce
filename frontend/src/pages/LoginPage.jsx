import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!validateEmail(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage("Please fix the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await http.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      login(response.data);
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ??
        "Unable to login. Check your credentials and try again.";
      setSubmitMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="page auth-shell">
        <div className="auth-aside">
          <Link className="auth-logo" to="/">
            ShopSphere
          </Link>
          <span className="section-kicker">Secure access</span>
          <h1>Welcome Back</h1>
          <p>
            Access your premium storefront account, review saved products and
            continue your orders with a clean, fast sign-in flow.
          </p>
          <div className="auth-stat-list">
            <div>
              <strong>24h</strong>
              <span>Flash sale access</span>
            </div>
            <div>
              <strong>Fast</strong>
              <span>Protected checkout</span>
            </div>
            <div>
              <strong>Pro</strong>
              <span>Monochrome shopping experience</span>
            </div>
          </div>
        </div>

        <div className="auth-card auth-fade-up">
          <div className="auth-card-header">
            <Link className="auth-mini-logo" to="/">
              ShopSphere
            </Link>
            <h2>Welcome Back</h2>
            <p>Sign in with your email and password.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field stagger-field" style={{ "--delay": "0.08s" }}>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email ? <p className="field-error">{errors.email}</p> : null}
            </div>

            <div className="auth-field stagger-field" style={{ "--delay": "0.16s" }}>
              <label htmlFor="login-password">Password</label>
              <div className="password-input-shell">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password ? (
                <p className="field-error">{errors.password}</p>
              ) : null}
            </div>

            <div className="auth-row stagger-field" style={{ "--delay": "0.24s" }}>
              <label className="check-row" htmlFor="remember-me">
                <input
                  id="remember-me"
                  name="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <Link className="auth-text-link" to="/login">
                Forgot password?
              </Link>
            </div>

            {submitMessage ? (
              <div
                className={`form-status ${
                  Object.keys(errors).length > 0 ? "status-error" : "status-success"
                }`}
              >
                {submitMessage}
              </div>
            ) : null}

            <button
              className="auth-submit stagger-field"
              disabled={isSubmitting}
              style={{ "--delay": "0.32s" }}
              type="submit"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            New to ShopSphere?{" "}
            <Link className="auth-text-link" to="/register">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
