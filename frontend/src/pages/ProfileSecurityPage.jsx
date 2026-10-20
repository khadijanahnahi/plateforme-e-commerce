import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { authApi } from "../api/authApi";
import ProfileIcon from "../components/profile/ProfileIcon";
import ProfileSectionCard from "../components/profile/ProfileSectionCard";
import { Button } from "../components/ui";
import { useToastContext } from "../contexts/ToastContext";

const emptyForm = {
  confirmPassword: "",
  currentPassword: "",
  newPassword: "",
};

function PasswordField({ autoComplete, error, label, name, onChange, value }) {
  const [visible, setVisible] = useState(false);
  const descriptionId = error ? `${name}-error` : undefined;

  return (
    <label className={`profile-hub-password-field${error ? " is-invalid" : ""}`} htmlFor={name}>
      <span>{label}</span>
      <span className="profile-hub-password-shell">
        <input
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          id={name}
          name={name}
          onChange={onChange}
          required
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={`${visible ? "Masquer" : "Afficher"} ${label.toLowerCase()}`}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? "Masquer" : "Afficher"}
        </button>
      </span>
      {error ? <small id={descriptionId}>{error}</small> : null}
    </label>
  );
}

function passwordStrength(password) {
  if (!password) return { label: "Non évalué", score: 0 };
  let score = password.length >= 8 ? 1 : 0;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score >= 4) return { label: "Robuste", score: 3 };
  if (score >= 2) return { label: "Correct", score: 2 };
  return { label: "Faible", score: 1 };
}

function translatePasswordError(error) {
  if (error?.response?.data?.message === "Current password is incorrect.") {
    return "Le mot de passe actuel est incorrect.";
  }
  return "Le mot de passe n’a pas pu être modifié. Vérifiez les informations puis réessayez.";
}

export default function ProfileSecurityPage() {
  const { logout } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToastContext();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const strength = passwordStrength(form.newPassword);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  }

  function validate() {
    const nextErrors = {};
    if (!form.currentPassword) nextErrors.currentPassword = "Le mot de passe actuel est obligatoire.";
    if (!form.newPassword) nextErrors.newPassword = "Le nouveau mot de passe est obligatoire.";
    else if (form.newPassword.length < 8 || form.newPassword.length > 100) {
      nextErrors.newPassword = "Le mot de passe doit contenir entre 8 et 100 caractères.";
    }
    if (!form.confirmPassword) nextErrors.confirmPassword = "Confirmez le nouveau mot de passe.";
    else if (form.newPassword !== form.confirmPassword) nextErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setServerError("");
    try {
      await authApi.updatePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(emptyForm);
      toast.success("Mot de passe modifié. Connectez-vous de nouveau.");
      try {
        await logout();
      } catch {
        // AuthContext efface toujours le jeton en mémoire dans son bloc finally.
      }
      navigate("/login", { replace: true });
    } catch (error) {
      setServerError(translatePasswordError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-hub-detail-page">
      <div className="profile-hub-content-heading">
        <span className="profile-hub-kicker">SÉCURITÉ</span>
        <h2>Modifier le mot de passe</h2>
        <p>Choisissez un mot de passe unique pour protéger votre espace ShopSphere.</p>
      </div>

      <ProfileSectionCard
        className="profile-hub-form-card"
        description="Toutes vos autres sessions seront révoquées après la modification."
        icon={<ProfileIcon name="shield" />}
        title="Nouveau mot de passe"
      >
        {serverError ? <div className="profile-hub-alert" role="alert">{serverError}</div> : null}
        <form className="profile-hub-form" noValidate onSubmit={handleSubmit}>
          <PasswordField
            autoComplete="current-password"
            error={errors.currentPassword}
            label="Mot de passe actuel"
            name="currentPassword"
            onChange={updateField}
            value={form.currentPassword}
          />
          <PasswordField
            autoComplete="new-password"
            error={errors.newPassword}
            label="Nouveau mot de passe"
            name="newPassword"
            onChange={updateField}
            value={form.newPassword}
          />
          <div className="profile-hub-strength" data-score={strength.score}>
            <div><span /><span /><span /></div>
            <p><strong>{strength.label}</strong> · 8 à 100 caractères requis. Les autres critères renforcent la sécurité.</p>
          </div>
          <PasswordField
            autoComplete="new-password"
            error={errors.confirmPassword}
            label="Confirmer le nouveau mot de passe"
            name="confirmPassword"
            onChange={updateField}
            value={form.confirmPassword}
          />
          <div className="profile-hub-form-actions">
            <Button disabled={saving} onClick={() => navigate("/profile")} variant="outline">Annuler</Button>
            <Button loading={saving} type="submit">Modifier le mot de passe</Button>
          </div>
        </form>
      </ProfileSectionCard>
    </div>
  );
}
