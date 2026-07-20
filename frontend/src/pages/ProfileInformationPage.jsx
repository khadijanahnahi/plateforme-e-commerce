import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { authApi } from "../api/authApi";
import ProfileIcon from "../components/profile/ProfileIcon";
import ProfileSectionCard from "../components/profile/ProfileSectionCard";
import { Button, Input } from "../components/ui";
import { useToastContext } from "../contexts/ToastContext";

const phonePattern = /^[+0-9()\-\s]{8,20}$/;

function initialForm(user) {
  return {
    email: user?.email ?? "",
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
  };
}

function translateApiError(error) {
  const message = error?.response?.data?.message;
  if (message === "An account with this email already exists.") {
    return "Un compte utilise déjà cette adresse email.";
  }
  return "Impossible de mettre à jour vos informations. Vérifiez les champs puis réessayez.";
}

function validate(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = "Le nom complet est obligatoire.";
  else if (form.fullName.trim().length > 120) errors.fullName = "Le nom ne doit pas dépasser 120 caractères.";

  if (!form.email.trim()) errors.email = "L’adresse email est obligatoire.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Saisissez une adresse email valide.";

  if (!form.phone.trim()) errors.phone = "Le téléphone est obligatoire.";
  else if (!phonePattern.test(form.phone.trim())) errors.phone = "Saisissez un numéro valide entre 8 et 20 caractères.";
  return errors;
}

export default function ProfileInformationPage() {
  const { login, user } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToastContext();
  const [form, setForm] = useState(() => initialForm(user));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialForm(user));
  }, [user]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setServerError("");
    try {
      const response = await authApi.updateProfile({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      });
      login(response.data);
      toast.success("Vos informations ont été mises à jour.");
      navigate("/profile", { replace: true });
    } catch (error) {
      setServerError(translateApiError(error));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm(initialForm(user));
    setErrors({});
    setServerError("");
    navigate("/profile");
  }

  return (
    <div className="profile-hub-detail-page">
      <div className="profile-hub-content-heading">
        <span className="profile-hub-kicker">INFORMATIONS</span>
        <h2>Informations personnelles</h2>
        <p>Mettez à jour les coordonnées utilisées pour votre compte et vos prochaines commandes.</p>
      </div>

      <ProfileSectionCard
        className="profile-hub-form-card"
        description="Votre rôle et vos autorisations ne peuvent pas être modifiés ici."
        icon={<ProfileIcon name="user" />}
        title="Coordonnées du compte"
      >
        {serverError ? <div className="profile-hub-alert" role="alert">{serverError}</div> : null}
        <form className="profile-hub-form" noValidate onSubmit={handleSubmit}>
          <Input
            autoComplete="name"
            error={errors.fullName}
            fullWidth
            label="Nom complet"
            maxLength={120}
            name="fullName"
            onChange={updateField}
            required
            value={form.fullName}
          />
          <Input
            autoComplete="email"
            error={errors.email}
            fullWidth
            label="Email"
            name="email"
            onChange={updateField}
            required
            type="email"
            value={form.email}
          />
          <Input
            autoComplete="tel"
            error={errors.phone}
            fullWidth
            helperText="8 à 20 caractères : chiffres, espaces, +, parenthèses ou tirets."
            label="Téléphone"
            name="phone"
            onChange={updateField}
            required
            value={form.phone}
          />
          <div className="profile-hub-form-actions">
            <Button disabled={saving} onClick={handleCancel} variant="outline">Annuler</Button>
            <Button loading={saving} type="submit">Enregistrer les modifications</Button>
          </div>
        </form>
      </ProfileSectionCard>
    </div>
  );
}
