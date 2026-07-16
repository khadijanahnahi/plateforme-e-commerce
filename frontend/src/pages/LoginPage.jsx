import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function hasAdminRole(user) {
  return user?.roles?.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");
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
      nextErrors.email = "L'email est obligatoire.";
    } else if (!validateEmail(form.email)) {
      nextErrors.email = "Veuillez saisir une adresse email valide.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Le mot de passe est obligatoire.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage("Veuillez corriger les champs indiqués.");
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
      navigate(hasAdminRole(response.data.user) ? "/admin/dashboard" : "/", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ??
        "Connexion impossible. Vérifiez vos identifiants puis réessayez.";
      setSubmitMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page login-page">
      <div className="page login-shell">
        <div className="auth-card login-card">
          <div className="auth-card-header">
            <span className="login-card-kicker">Espace membre</span>
            <h2>Bienvenue</h2>
            <p>Connectez-vous pour retrouver votre univers ShopSphere.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field stagger-field" style={{ "--delay": "0.08s" }}>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                value={form.email}
                onChange={handleChange}
              />
              {errors.email ? <p className="field-error">{errors.email}</p> : null}
            </div>

            <div className="auth-field stagger-field" style={{ "--delay": "0.16s" }}>
              <label htmlFor="login-password">Mot de passe</label>
              <div className="password-input-shell">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? "Masquer" : "Voir"}
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
                <span>Se souvenir de moi</span>
              </label>
              <Link className="auth-text-link" to="/forgot-password">
                Mot de passe oublié ?
              </Link>
            </div>

            {submitMessage ? (
              <div
                className="form-status status-error"
                role="alert"
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
              {isSubmitting ? (
                <>
                  <span className="login-submit-spinner" aria-hidden="true" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <p className="auth-switch">
            Nouveau sur ShopSphere ?{" "}
            <Link className="auth-text-link" to="/register">
              Créer un compte
            </Link>
          </p>

          <div className="login-security-note" aria-label="Connexion sécurisée">
            <span className="login-security-pulse" aria-hidden="true" />
            <span>Connexion sécurisée</span>
            <span className="login-security-divider" aria-hidden="true" />
            <span>Données protégées</span>
          </div>
        </div>
      </div>
    </section>
  );
}
