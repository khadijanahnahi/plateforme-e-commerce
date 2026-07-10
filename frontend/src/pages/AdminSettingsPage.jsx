import AdminPageHeader from "../components/layout/AdminPageHeader";
import { useAdminSettings } from "../hooks/useAdminSettings";
import useFeedbackToast from "../hooks/useFeedbackToast";

function SettingsSwitch({ checked, description, disabled = false, label, name, onChange }) {
  return (
    <label className={`settings-switch-row ${disabled ? "settings-switch-disabled" : ""}`}>
      <span><strong>{label}</strong><small>{description}</small></span>
      <input checked={checked} disabled={disabled} name={name} type="checkbox" onChange={onChange} />
      <span className="settings-switch-control" aria-hidden="true" />
    </label>
  );
}

function SettingsSkeleton() {
  return (
    <div className="settings-skeleton-grid" aria-busy="true" aria-label="Chargement des paramètres">
      {[0, 1, 2, 3].map((item) => <div className="settings-skeleton-card" key={item} />)}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { error, form, loading, message, saveSettings, saving, updatedAt, updateField } = useAdminSettings();
  useFeedbackToast(message, error);

  return (
    <section className="page admin-page admin-settings-page">
      <AdminPageHeader
        kicker="Configuration boutique"
        title="Paramètres"
        description="Gérez les informations publiques et les règles métier de ShopSphere. Les secrets techniques restent protégés dans l’environnement serveur."
      />

      {error ? <div className="admin-alert">{error}</div> : null}

      {loading ? <SettingsSkeleton /> : (
        <form className="settings-form" onSubmit={saveSettings}>
          <div className="settings-grid">
            <article className="settings-card settings-card-wide reveal-card">
              <header><span>01</span><div><h2>Informations de la boutique</h2><p>Identité et coordonnées affichées aux clients.</p></div></header>
              <div className="settings-fields-grid">
                <label><span>Nom de la boutique</span><input name="storeName" value={form.storeName} onChange={updateField} maxLength="120" required /></label>
                <label><span>Devise</span><select name="currency" value={form.currency} onChange={updateField} required><option value="MAD">MAD — Dirham marocain</option><option value="EUR">EUR — Euro</option><option value="USD">USD — Dollar américain</option></select></label>
                <label><span>Email support</span><input name="supportEmail" type="email" value={form.supportEmail} onChange={updateField} required /></label>
                <label><span>Téléphone support</span><input name="supportPhone" value={form.supportPhone} onChange={updateField} maxLength="40" /></label>
                <label className="settings-field-full"><span>Adresse de la boutique</span><textarea name="storeAddress" value={form.storeAddress} onChange={updateField} rows="3" /></label>
              </div>
            </article>

            <article className="settings-card reveal-card">
              <header><span>02</span><div><h2>Livraison</h2><p>Tarification et informations présentées au checkout.</p></div></header>
              <div className="settings-fields-grid settings-fields-single">
                <label><span>Frais de livraison (DH)</span><input min="0" name="deliveryFee" step="0.01" type="number" value={form.deliveryFee} onChange={updateField} required /></label>
                <label><span>Livraison gratuite à partir de (DH)</span><input min="0" name="freeDeliveryThreshold" step="0.01" type="number" value={form.freeDeliveryThreshold} onChange={updateField} required /></label>
                <label><span>Délai estimé</span><input maxLength="240" name="estimatedDeliveryText" value={form.estimatedDeliveryText} onChange={updateField} required /></label>
              </div>
              <SettingsSwitch checked={form.cashOnDeliveryEnabled} description="Autoriser le paiement lors de la réception." label="Paiement à la livraison" name="cashOnDeliveryEnabled" onChange={updateField} />
            </article>

            <article className="settings-card reveal-card">
              <header><span>03</span><div><h2>Emails métier</h2><p>Contrôlez les notifications sans exposer AWS SES.</p></div></header>
              <div className="settings-switch-list">
                <SettingsSwitch checked={form.emailNotificationsEnabled} description="Interrupteur principal des emails métier." label="Notifications email" name="emailNotificationsEnabled" onChange={updateField} />
                <SettingsSwitch checked={form.orderConfirmationEmailEnabled} description="Envoyer un reçu après création de commande." disabled={!form.emailNotificationsEnabled} label="Confirmation de commande" name="orderConfirmationEmailEnabled" onChange={updateField} />
                <SettingsSwitch checked={form.orderStatusEmailEnabled} description="Notifier confirmation, expédition, livraison ou annulation." disabled={!form.emailNotificationsEnabled} label="Changement de statut" name="orderStatusEmailEnabled" onChange={updateField} />
                <SettingsSwitch checked={form.invoiceEmailEnabled} description="Autoriser les notifications liées aux factures." disabled={!form.emailNotificationsEnabled} label="Emails de facture" name="invoiceEmailEnabled" onChange={updateField} />
              </div>
              <p className="settings-security-note">Les identifiants SMTP restent exclusivement dans <code>.env.production</code>.</p>
            </article>

            <article className="settings-card reveal-card">
              <header><span>04</span><div><h2>Facturation</h2><p>Personnalisez les prochaines factures générées.</p></div></header>
              <div className="settings-fields-grid settings-fields-single">
                <label><span>Préfixe facture</span><input maxLength="20" name="invoicePrefix" pattern="[A-Za-z0-9_-]+" value={form.invoicePrefix} onChange={updateField} required /></label>
                <label><span>Note de pied de facture</span><textarea maxLength="500" name="invoiceFooterNote" rows="4" value={form.invoiceFooterNote} onChange={updateField} /></label>
              </div>
            </article>

            <article className="settings-card reveal-card">
              <header><span>05</span><div><h2>Gestion du stock</h2><p>Définissez le niveau qui demande une attention administrative.</p></div></header>
              <div className="settings-fields-grid settings-fields-single">
                <label><span>Seuil de stock faible</span><input min="0" name="lowStockThreshold" step="1" type="number" value={form.lowStockThreshold} onChange={updateField} required /></label>
              </div>
            </article>
          </div>

          <div className="settings-save-bar">
            <div><strong>Configuration globale</strong><small>{updatedAt ? `Dernière mise à jour : ${new Date(updatedAt).toLocaleString("fr-FR")}` : "Enregistrez vos modifications."}</small></div>
            <button className="button button-primary" disabled={saving} type="submit">{saving ? "Enregistrement..." : "Enregistrer les modifications"}</button>
          </div>
        </form>
      )}
    </section>
  );
}
