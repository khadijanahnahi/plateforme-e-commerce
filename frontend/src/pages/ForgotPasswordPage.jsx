import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/authApi";

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

const genericSuccessMessage =
  "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("L'email est obligatoire.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Veuillez saisir une adresse email valide.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.forgotPassword(email.trim());
      setMessage(response.data?.message || genericSuccessMessage);
    } catch (requestError) {
      const apiMessage = requestError.response?.data?.message;
      setError(apiMessage || "Impossible d'envoyer le lien pour le moment.");
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
          <span className="section-kicker">Acces securise</span>
          <h1>Mot de passe oublie</h1>
          <p>
            Entrez votre email. Si votre compte existe, nous vous enverrons un
            lien temporaire valable 30 minutes.
          </p>
          <div className="auth-stat-list">
            <div>
              <strong>30 min</strong>
              <span>Lien temporaire</span>
            </div>
            <div>
              <strong>Prive</strong>
              <span>Email non revele</span>
            </div>
            <div>
              <strong>SES</strong>
              <span>Email securise</span>
            </div>
          </div>
        </div>

        <div className="auth-card auth-fade-up">
          <div className="auth-card-header">
            <Link className="auth-mini-logo" to="/">
              ShopSphere
            </Link>
            <h2>Reinitialisation</h2>
            <p>Recevez un lien pour creer un nouveau mot de passe.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field stagger-field" style={{ "--delay": "0.08s" }}>
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                placeholder="vous@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                  setMessage("");
                }}
              />
              {error ? <p className="field-error">{error}</p> : null}
            </div>

            {message ? <div className="form-status status-success">{message}</div> : null}

            <button
              className="auth-submit stagger-field"
              disabled={isSubmitting}
              style={{ "--delay": "0.16s" }}
              type="submit"
            >
              {isSubmitting ? "Envoi..." : "Envoyer le lien"}
            </button>
          </form>

          <p className="auth-switch">
            Vous connaissez votre mot de passe ?{" "}
            <Link className="auth-text-link" to="/login">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
