import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
};

export default function ProfilePage() {
  const { isAuthenticated, login, user } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roles = user?.roles?.length ? user.roles.join(", ") : "USER";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updatePasswordField(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await http.put("/profile", form);
      login(response.data);
      setMessage("Profile updated. Future orders will use the new information.");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    setSavingPassword(true);

    try {
      await http.put("/profile/password", passwordForm);
      setPasswordForm(emptyPasswordForm);
      setPasswordMessage("Password updated.");
    } catch (exception) {
      setPasswordError(exception.response?.data?.message ?? "Unable to update password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section className="page profile-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Client account</span>
          <h1>Mon profil</h1>
          <p>Modifie tes informations personnelles. Les anciennes commandes gardent les informations utilisees au moment de l'achat.</p>
        </div>
      </div>

      <div className="profile-grid">
        <article className="profile-card">
          <div className="profile-avatar">
            {(user?.fullName ?? "C").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <span className="section-kicker">Identity</span>
            <h2>{user?.fullName ?? "Client ShopSphere"}</h2>
            <p>{user?.email}</p>
          </div>
        </article>

        <article className="profile-card profile-info-card">
          <h2>Informations actuelles</h2>
          <dl className="profile-list">
            <div>
              <dt>Nom complet</dt>
              <dd>{user?.fullName ?? "-"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email ?? "-"}</dd>
            </div>
            <div>
              <dt>Telephone</dt>
              <dd>{user?.phone ?? "-"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roles}</dd>
            </div>
          </dl>
        </article>

        <form className="profile-card admin-form profile-edit-card" onSubmit={saveProfile}>
          <h2>Modifier mes informations</h2>
          {message ? <div className="admin-alert admin-success">{message}</div> : null}
          {error ? <div className="admin-alert">{error}</div> : null}
          <input name="fullName" value={form.fullName} onChange={updateField} placeholder="Full name" required />
          <input name="email" value={form.email} onChange={updateField} type="email" placeholder="Email" required />
          <input name="phone" value={form.phone} onChange={updateField} placeholder="Phone" required />
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form className="profile-card admin-form profile-edit-card" onSubmit={savePassword}>
          <h2>Changer le mot de passe</h2>
          {passwordMessage ? <div className="admin-alert admin-success">{passwordMessage}</div> : null}
          {passwordError ? <div className="admin-alert">{passwordError}</div> : null}
          <input
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={updatePasswordField}
            type="password"
            placeholder="Current password"
            required
          />
          <input
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={updatePasswordField}
            type="password"
            placeholder="New password"
            minLength="8"
            required
          />
          <button className="button button-primary" type="submit" disabled={savingPassword}>
            {savingPassword ? "Saving..." : "Save password"}
          </button>
        </form>

        <article className="profile-card profile-actions-card">
          <h2>Actions rapides</h2>
          <div className="profile-actions">
            <Link className="button button-primary" to="/orders">Mes commandes</Link>
            <Link className="button button-secondary" to="/cart">Voir panier</Link>
            <Link className="button button-secondary" to="/checkout">Checkout</Link>
            <Link className="button button-secondary" to="/products">Continuer shopping</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
