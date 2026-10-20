import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/authApi";

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: "Faible", level: "weak", width: "33%" };
  }

  if (score <= 3) {
    return { label: "Moyen", level: "medium", width: "66%" };
  }

  return { label: "Fort", level: "strong", width: "100%" };
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.newPassword),
    [form.newPassword],
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!token) {
      nextErrors.form = "Le lien de reinitialisation est invalide.";
    }

    if (!form.newPassword.trim()) {
      nextErrors.newPassword = "Le nouveau mot de passe est obligatoire.";
    } else if (form.newPassword.length < 8) {
      nextErrors.newPassword = "Le mot de passe doit contenir au moins 8 caracteres.";
    } else if (
      !/[a-z]/.test(form.newPassword) ||
      !/[A-Z]/.test(form.newPassword) ||
      !/\d/.test(form.newPassword)
    ) {
      nextErrors.newPassword =
        "Le mot de passe doit contenir une minuscule, une majuscule et un chiffre.";
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Veuillez confirmer le mot de passe.";
    } else if (form.confirmPassword !== form.newPassword) {
      nextErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await authApi.resetPassword({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setMessage(response.data?.message || "Votre mot de passe a ete reinitialise.");
      window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (requestError) {
      const apiMessage = requestError.response?.data?.message;
      setErrors({ form: apiMessage || "Impossible de reinitialiser le mot de passe." });
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
          <span className="section-kicker">Nouveau mot de passe</span>
          <h1>Protegez votre compte</h1>
          <p>
            Choisissez un mot de passe fort pour securiser vos commandes, votre
            profil et votre wishlist.
          </p>
          <div className="auth-stat-list">
            <div>
              <strong>8+</strong>
              <span>Caracteres</span>
            </div>
            <div>
              <strong>Aa</strong>
              <span>Majuscule et minuscule</span>
            </div>
            <div>
              <strong>123</strong>
              <span>Chiffre requis</span>
            </div>
          </div>
        </div>

        <div className="auth-card auth-fade-up">
          <div className="auth-card-header">
            <Link className="auth-mini-logo" to="/">
              ShopSphere
            </Link>
            <h2>Creer un nouveau mot de passe</h2>
            <p>Le lien est temporaire. Utilisez-le avant son expiration.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field stagger-field" style={{ "--delay": "0.08s" }}>
              <label htmlFor="reset-new-password">Nouveau mot de passe</label>
              <div className="password-input-shell">
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nouveau mot de passe"
                  value={form.newPassword}
                  onChange={handleChange}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? "Masquer" : "Voir"}
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
              {errors.newPassword ? (
                <p className="field-error">{errors.newPassword}</p>
              ) : null}
            </div>

            <div className="auth-field stagger-field" style={{ "--delay": "0.16s" }}>
              <label htmlFor="reset-confirm-password">Confirmer le mot de passe</label>
              <div className="password-input-shell">
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez le mot de passe"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword ? "Masquer" : "Voir"}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="field-error">{errors.confirmPassword}</p>
              ) : null}
            </div>

            {errors.form ? <div className="form-status status-error">{errors.form}</div> : null}

            {message ? <div className="form-status status-success">{message}</div> : null}

            <button
              className="auth-submit stagger-field"
              disabled={isSubmitting}
              style={{ "--delay": "0.24s" }}
              type="submit"
            >
              {isSubmitting ? "Reinitialisation..." : "Reinitialiser le mot de passe"}
            </button>
          </form>

          <p className="auth-switch">
            Retour a la connexion ?{" "}
            <Link className="auth-text-link" to="/login">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
