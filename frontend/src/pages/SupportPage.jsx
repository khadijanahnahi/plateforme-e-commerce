import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicSettingsApi } from "../api/publicSettingsApi";
import { getSupportApiError, supportApi } from "../api/supportApi";

const supportHighlights = [
  {
    title: "Réponse rapide",
    text: "Notre équipe répond sous 24 heures les jours ouvrés.",
  },
  {
    title: "Aide paiement à la livraison",
    text: "Des explications claires pour payer en toute sécurité à la réception.",
  },
  {
    title: "Suivi de commande",
    text: "Suivez votre commande et restez informé à chaque étape.",
  },
  {
    title: "Retours & échanges",
    text: "Retours simplifiés sous 30 jours pour les articles éligibles.",
  },
];

const faqs = [
  {
    question: "Combien de temps prend la livraison ?",
    answer: "La livraison standard prend généralement de 2 à 5 jours ouvrés après confirmation de votre commande.",
  },
  {
    question: "Puis-je modifier ou annuler ma commande ?",
    answer: "Vous pouvez demander une modification ou une annulation tant que la commande est en attente. Une fois expédiée, cela peut ne plus être possible.",
  },
  {
    question: "Quelle est votre politique de retour ?",
    answer: "Les articles éligibles peuvent être retournés sous 30 jours s'ils sont inutilisés et dans leur état d'origine.",
  },
  {
    question: "Comment suivre ma commande ?",
    answer: "Connectez-vous à votre compte et ouvrez \"Mes commandes\" pour voir les dernières mises à jour de statut.",
  },
  {
    question: "Proposez-vous la livraison internationale ?",
    answer: "La livraison internationale peut être activée selon la destination et la disponibilité des transporteurs.",
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "Pour cette version, ShopSphere utilise le paiement à la livraison. Le paiement en ligne pourra être ajouté ultérieurement.",
  },
];

export default function SupportPage() {
  const [imageFailed, setImageFailed] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [storeSettings, setStoreSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadPublicSettings() {
      setSettingsLoading(true);
      setSettingsError(false);

      try {
        const response = await publicSettingsApi.getSettings({ signal: controller.signal });
        setStoreSettings(response.data);
      } catch (exception) {
        if (exception.code !== "ERR_CANCELED") {
          setSettingsError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSettingsLoading(false);
        }
      }
    }

    loadPublicSettings();
    return () => controller.abort();
  }, []);

  const contactDetails = [
    storeSettings?.supportEmail
      ? {
          label: "Nous écrire",
          value: storeSettings.supportEmail,
          href: `mailto:${storeSettings.supportEmail}`,
          detail: "Pour toute question sur vos commandes, livraisons ou votre compte.",
        }
      : null,
    storeSettings?.supportPhone
      ? {
          label: "Nous appeler",
          value: storeSettings.supportPhone,
          href: `tel:${storeSettings.supportPhone.replace(/[^\d+]/g, "")}`,
          detail: "Parlez directement à notre équipe du service client.",
        }
      : null,
    storeSettings?.storeAddress
      ? {
          label: "Nous trouver",
          value: storeSettings.storeAddress,
          detail: "Adresse de la boutique ShopSphere.",
        }
      : null,
  ].filter(Boolean);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      subject: String(formData.get("subject") ?? "").trim(),
      orderNumber: String(formData.get("orderNumber") ?? "").trim() || null,
      message: String(formData.get("message") ?? "").trim(),
    };

    setSubmitting(true);
    setSubmitted(false);
    setSubmitError("");
    try {
      await supportApi.createMessage(payload);
      setSubmitted(true);
      form.reset();
    } catch (exception) {
      setSubmitError(getSupportApiError(exception));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="support-page">
      <section className="page support-hero-section">
        <div className="support-hero-card">
          <div className="support-hero-copy">
            <span className="section-kicker">Service client</span>
            <h1>Support & Contact</h1>
            <p>Nous sommes là pour vous aider avec vos commandes, livraisons, retours et questions de compte.</p>
            <div className="support-hero-actions">
              <a className="support-btn support-btn-dark" href="#support-message">Envoyer un message</a>
              <Link className="support-btn support-btn-outline" to="/orders">Suivre une commande</Link>
            </div>
          </div>

          <div className="support-hero-visual">
            {!imageFailed ? (
              <img
                src="/images/support-hero.webp"
                alt="Service client et suivi de commande ShopSphere"
                className="support-hero-image"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="support-hero-placeholder">
                <span>Aperçu de l'image indisponible</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="page support-main-grid">
        <form id="support-message" className="support-card support-form-card" onSubmit={handleSubmit}>
          <span className="section-kicker">Message</span>
          <h2>Envoyez-nous un message</h2>

          <div className="support-form-row">
            <div className="support-field">
              <input id="support-fullName" name="fullName" placeholder=" " aria-label="Nom complet" required />
              <label htmlFor="support-fullName">Nom complet</label>
            </div>
            <div className="support-field">
              <input id="support-email" name="email" type="email" placeholder=" " aria-label="Adresse email" required />
              <label htmlFor="support-email">Email</label>
            </div>
          </div>

          <div className="support-form-row">
            <div className="support-field support-field-select">
              <label htmlFor="support-subject">Sujet</label>
              <select id="support-subject" name="subject" defaultValue="" aria-label="Sujet de la demande" required>
                <option value="" disabled>Choisir un sujet</option>
                <option>Question sur une commande</option>
                <option>Livraison & expédition</option>
                <option>Retours & échanges</option>
                <option>Aide sur mon compte</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="support-field">
              <input id="support-orderNumber" name="orderNumber" placeholder=" " aria-label="Numéro de commande (facultatif)" />
              <label htmlFor="support-orderNumber">Numéro de commande (facultatif)</label>
            </div>
          </div>

          <div className="support-field support-field-full">
            <textarea id="support-message-field" name="message" placeholder=" " aria-label="Votre message" required />
            <label htmlFor="support-message-field">Votre message</label>
          </div>

          <button className="support-btn support-btn-dark support-submit" disabled={submitting} type="submit">
            {submitting ? "Envoi en cours..." : "Envoyer la demande"}
          </button>
          {submitted ? <p className="support-success">Message reçu. Notre équipe vous contactera rapidement.</p> : null}
          {submitError ? <p className="support-error">{submitError}</p> : null}
          <small>Vos informations sont sécurisées et utilisées uniquement pour vous assister.</small>
        </form>

        <aside className="support-side-stack">
          <div className="support-card">
            <span className="section-kicker">Contact</span>
            <h2>Coordonnées</h2>
            <div className="support-contact-list">
              {settingsLoading ? <p aria-live="polite">Chargement des coordonnées...</p> : null}
              {!settingsLoading && settingsError ? (
                <p role="alert">Les coordonnées sont temporairement indisponibles.</p>
              ) : null}
              {!settingsLoading && !settingsError && contactDetails.length === 0 ? (
                <p>Les coordonnées seront bientôt disponibles.</p>
              ) : null}
              {!settingsLoading && !settingsError
                ? contactDetails.map((item) => (
                    <div key={item.label}>
                      <span>{item.label}</span>
                      <strong>
                        {item.href ? <a href={item.href}>{item.value}</a> : item.value}
                      </strong>
                      <p>{item.detail}</p>
                    </div>
                  ))
                : null}
            </div>
          </div>
        </aside>
      </section>

      <section className="page support-highlight-grid">
        {supportHighlights.map((item, index) => (
          <article className="support-highlight-card" key={item.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section id="support-faq" className="page support-faq-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">FAQ Support</span>
            <h2>Questions fréquentes</h2>
          </div>
          <p>Les réponses aux questions les plus posées à notre support ShopSphere.</p>
        </div>

        <div className="support-faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <article className={`support-faq-item ${isOpen ? "support-faq-open" : ""}`} key={faq.question}>
                <button type="button" aria-expanded={isOpen} onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}>
                  <span>{faq.question}</span>
                  <strong aria-hidden="true">{isOpen ? "\u2212" : "+"}</strong>
                </button>
                {isOpen && (
                  <div className="support-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="page support-cta-section">
        <div className="support-cta-card">
          <div>
            <span className="section-kicker">Besoin d'aide supplémentaire ?</span>
            <h2>Encore une question ?</h2>
            <p>Notre équipe support est prête à vous accompagner.</p>
          </div>
          <div className="support-cta-actions">
            <a className="support-btn support-btn-outline-light" href="#support-message">Contacter le support</a>
            <a className="support-btn support-btn-light" href="#support-faq">Voir le centre d'aide</a>
          </div>
        </div>
      </section>
    </div>
  );
}
