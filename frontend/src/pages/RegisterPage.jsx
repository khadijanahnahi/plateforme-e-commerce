import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: "Weak", level: "weak", width: "33%" };
  }

  if (score <= 3) {
    return { label: "Medium", level: "medium", width: "66%" };
  }

  return { label: "Strong", level: "strong", width: "100%" };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [toastVisible, setToastVisible] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

  useEffect(() => {
    if (!toastVisible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastVisible(false);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastVisible]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!validateEmail(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage("Please correct the form before creating your account.");
      setToastVisible(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    setToastVisible(false);

    try {
      const response = await http.post("/auth/register", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      login(response.data);
      setToastVisible(true);
      navigate("/profile", { replace: true });
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      const validationErrors = error.response?.data?.validationErrors;

      if (validationErrors) {
        setErrors(validationErrors);
      }

      setSubmitMessage(apiMessage ?? "Unable to create account. Please try again.");
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
          <span className="section-kicker">Join the store</span>
          <h1>Create your account</h1>
          <p>
            Build your account to access new drops, save your curated products
            and track every premium order from one place.
          </p>
          <div className="auth-stat-list">
            <div>
              <strong>1 click</strong>
              <span>Wishlist saving</span>
            </div>
            <div>
              <strong>Secure</strong>
              <span>Protected customer area</span>
            </div>
            <div>
              <strong>Instant</strong>
              <span>Order tracking access</span>
            </div>
          </div>
        </div>

        <div className="auth-card auth-fade-up">
          <div className="auth-card-header">
            <Link className="auth-mini-logo" to="/">
              ShopSphere
            </Link>
            <h2>Create your account</h2>
            <p>Fill the details below to create your customer profile.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field stagger-field" style={{ "--delay": "0.06s" }}>
              <label htmlFor="register-fullName">Full name</label>
              <input
                id="register-fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={handleChange}
              />
              {errors.fullName ? (
                <p className="field-error">{errors.fullName}</p>
              ) : null}
            </div>

            <div className="auth-field stagger-field" style={{ "--delay": "0.12s" }}>
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email ? <p className="field-error">{errors.email}</p> : null}
            </div>

            <div className="auth-field stagger-field" style={{ "--delay": "0.18s" }}>
              <label htmlFor="register-phone">Phone</label>
              <input
                id="register-phone"
                name="phone"
                type="tel"
                placeholder="+212 6 00 00 00 00"
                value={form.phone}
                onChange={handleChange}
              />
              {errors.phone ? <p className="field-error">{errors.phone}</p> : null}
            </div>

            <div className="auth-field stagger-field" style={{ "--delay": "0.24s" }}>
              <label htmlFor="register-password">Password</label>
              <div className="password-input-shell">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
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
              <div className="password-strength">
                <div className="strength-track">
                  <div
                    className={`strength-fill strength-${passwordStrength.level}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <span>{passwordStrength.label}</span>
              </div>
              {errors.password ? (
                <p className="field-error">{errors.password}</p>
              ) : null}
            </div>

            <div className="auth-field stagger-field" style={{ "--delay": "0.3s" }}>
              <label htmlFor="register-confirmPassword">Confirm password</label>
              <div className="password-input-shell">
                <input
                  id="register-confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="field-error">{errors.confirmPassword}</p>
              ) : null}
            </div>

            {submitMessage ? (
              <div className="form-status status-error">{submitMessage}</div>
            ) : null}

            <button
              className="auth-submit stagger-field"
              disabled={isSubmitting}
              style={{ "--delay": "0.36s" }}
              type="submit"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link className="auth-text-link" to="/login">
              Login
            </Link>
          </p>

          {toastVisible ? (
            <div className="auth-toast" role="status" aria-live="polite">
              Account created successfully. You can now sign in.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
