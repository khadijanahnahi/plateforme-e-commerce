import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function getPasswordStrength(password) {
  if (!password) {
    return { label: "À définir", level: "empty", width: "0%" };
  }

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
      nextErrors.fullName = "Le nom complet est obligatoire.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "L'email est obligatoire.";
    } else if (!validateEmail(form.email)) {
      nextErrors.email = "Veuillez saisir une adresse email valide.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Le numéro de téléphone est obligatoire.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Le mot de passe est obligatoire.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Veuillez confirmer votre mot de passe.";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage("Veuillez corriger les champs indiqués.");
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

      setSubmitMessage(apiMessage ?? "Impossible de créer le compte. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page register-page">
      <div className="page register-shell">
        <div className="auth-card register-card">
          <div className="auth-card-header">
            <span className="register-card-kicker">Inscription</span>
            <h2>Créer votre compte</h2>
            <p>Quelques informations suffisent pour rejoindre ShopSphere.</p>
          </div>

          <form className="auth-form register-form" onSubmit={handleSubmit}>
            <div className="register-form-grid">
            <div className="auth-field stagger-field" style={{ "--delay": "0.06s" }}>
              <label htmlFor="register-fullName">Nom complet</label>
              <input
                id="register-fullName"
                name="fullName"
                type="text"
                placeholder="Votre nom "
                autoComplete="name"
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
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email ? <p className="field-error">{errors.email}</p> : null}
            </div>

            <div className="auth-field register-field-wide stagger-field" style={{ "--delay": "0.18s" }}>
              <label htmlFor="register-phone">Téléphone</label>
              <input
                id="register-phone"
                name="phone"
                type="tel"
                placeholder="+212 6 00 00 00 00"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
              />
              {errors.phone ? <p className="field-error">{errors.phone}</p> : null}
            </div>

            <div className="auth-field stagger-field" style={{ "--delay": "0.24s" }}>
              <label htmlFor="register-password">Mot de passe</label>
              <div className="password-input-shell">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8 caractères minimum"
                  autoComplete="new-password"
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
              <label htmlFor="register-confirmPassword">Confirmer le mot de passe</label>
              <div className="password-input-shell">
                <input
                  id="register-confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Répétez votre mot de passe"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showConfirmPassword ? "Masquer" : "Voir"}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="field-error">{errors.confirmPassword}</p>
              ) : null}
            </div>
            </div>

            {submitMessage ? (
              <div className="form-status status-error" role="alert">{submitMessage}</div>
            ) : null}

            <button
              className="auth-submit stagger-field"
              disabled={isSubmitting}
              style={{ "--delay": "0.36s" }}
              type="submit"
            >
              {isSubmitting ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          <p className="auth-switch">
            Vous avez déjà un compte ?{" "}
            <Link className="auth-text-link" to="/login">
              Se connecter
            </Link>
          </p>

          {toastVisible ? (
            <div className="auth-toast" role="status" aria-live="polite">
              Votre compte a été créé avec succès.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
