import { Link } from "react-router-dom";
import privacyHeroImage from "../../images/image secu.webp";
import "../styles/privacy-policy.css";

const sections = [
  {
    id: "donnees-collectees",
    icon: "database",
    title: "Données collectées",
    text: "ShopSphere collecte uniquement les informations nécessaires au fonctionnement du compte et à la gestion des commandes : nom, email, téléphone, adresse de livraison, commandes, avis produits et informations de wishlist.",
  },
  {
    id: "utilisation",
    icon: "user",
    title: "Utilisation des données",
    text: "Vos données permettent de gérer votre compte, traiter vos commandes, organiser la livraison, envoyer les communications transactionnelles et améliorer votre expérience sur la boutique.",
  },
  {
    id: "securite",
    icon: "shield",
    title: "Sécurité",
    text: "Les mots de passe sont hashés côté serveur. Les accès sensibles sont protégés et l'application utilise une session sécurisée afin de limiter les accès non autorisés à vos informations.",
  },
  {
    id: "partage",
    icon: "share",
    title: "Partage limité",
    text: "Vos informations sont partagées uniquement lorsque le traitement de la commande l'exige, notamment avec les prestataires chargés de la livraison ou de l'hébergement technique.",
  },
  {
    id: "cookies",
    icon: "cookie",
    title: "Cookies et stockage local",
    text: "Le site utilise les mécanismes nécessaires au maintien sécurisé de la session et peut conserver localement certaines préférences d'affichage afin de simplifier votre navigation.",
  },
  {
    id: "emails",
    icon: "mail",
    title: "Emails transactionnels",
    text: "ShopSphere peut envoyer des emails liés aux commandes, changements de statut, factures, réinitialisations de mot de passe et demandes adressées au support.",
  },
  {
    id: "droits",
    icon: "rights",
    title: "Vos droits",
    text: "Selon la réglementation applicable, vous pouvez demander l'accès, la rectification, la suppression ou la limitation du traitement de certaines données personnelles.",
  },
  {
    id: "conservation",
    icon: "clock",
    title: "Conservation",
    text: "Les données sont conservées uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées et au respect des obligations légales et comptables.",
  },
  {
    id: "contact",
    icon: "support",
    title: "Contact et confidentialité",
    text: "Pour toute question concernant vos informations personnelles ou l'exercice de vos droits, contactez l'équipe ShopSphere depuis la page Support.",
  },
];

function PrivacyIcon({ type }) {
  const paths = {
    database: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" />
      </>
    ),
    shield: <path d="M12 3 5.5 6v5.3c0 4.1 2.6 7.8 6.5 9.7 3.9-1.9 6.5-5.6 6.5-9.7V6L12 3Zm-2 9 1.4 1.4L14.7 10" />,
    share: (
      <>
        <circle cx="6" cy="12" r="2.2" />
        <circle cx="17.5" cy="6" r="2.2" />
        <circle cx="17.5" cy="18" r="2.2" />
        <path d="m8 11 7.4-3.9M8 13l7.4 3.9" />
      </>
    ),
    cookie: (
      <>
        <path d="M20 13.2A8 8 0 1 1 10.8 4a4.7 4.7 0 0 0 5.2 5.2A4.7 4.7 0 0 0 20 13.2Z" />
        <circle cx="8.5" cy="11.5" r=".7" fill="currentColor" stroke="none" />
        <circle cx="11.5" cy="16" r=".7" fill="currentColor" stroke="none" />
      </>
    ),
    mail: (
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m5 7 7 5 7-5" />
      </>
    ),
    rights: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3.6 2.4-5.4 5.5-5.4 1.5 0 2.7.4 3.6 1.2" />
        <path d="m15 17 1.8 1.8L21 14.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
    support: (
      <>
        <path d="M4.5 13v-2a7.5 7.5 0 0 1 15 0v2" />
        <path d="M4.5 12.5h2.7v5H5.8c-.7 0-1.3-.6-1.3-1.3v-3.7ZM19.5 12.5h-2.7v5h1.4c.7 0 1.3-.6 1.3-1.3v-3.7ZM16.8 18c-.7 1.3-2.3 2-4.8 2" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className="privacy-icon" fill="none" viewBox="0 0 24 24">
      {paths[type]}
    </svg>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-policy-page">
      <div className="privacy-policy-shell">
        <aside className="privacy-policy-sidebar privacy-reveal" style={{ "--privacy-delay": "40ms" }}>
          <div className="privacy-summary-card">
            <span className="privacy-side-label">Sommaire</span>
            <nav aria-label="Sommaire de la politique de confidentialité">
              {sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  <PrivacyIcon type={section.icon} />
                  <span>{section.title}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className="privacy-help-card">
            <span className="privacy-icon-bubble"><PrivacyIcon type="support" /></span>
            <h2>Besoin d’aide&nbsp;?</h2>
            <p>Notre équipe vous accompagne pour toute question concernant vos données.</p>
            <Link to="/support">Contacter le support <span aria-hidden="true">→</span></Link>
          </div>
        </aside>

        <div className="privacy-policy-content">
          <section className="privacy-policy-hero privacy-reveal" style={{ "--privacy-delay": "90ms" }}>
            <div className="privacy-hero-copy">
              <span className="privacy-kicker">Données personnelles</span>
              <h1>Politique de confidentialité</h1>
              <p>
                Chez ShopSphere, la confiance est au cœur de notre relation. Découvrez
                comment nous collectons, utilisons et protégeons vos informations.
              </p>
              <span className="privacy-version">
                <PrivacyIcon type="shield" />
                Version actuelle de la politique
              </span>
            </div>

            <div className="privacy-hero-visual" aria-hidden="true">
              <div className="privacy-image-glow" />
              <img src={privacyHeroImage} alt="" />
            </div>

            <div className="privacy-trust-strip" aria-label="Engagements de confidentialité">
              <span><PrivacyIcon type="shield" /> Données sécurisées</span>
              <span><PrivacyIcon type="database" /> Stockage maîtrisé</span>
              <span><PrivacyIcon type="support" /> Support disponible</span>
            </div>
          </section>

          <div className="privacy-policy-body">
            <section className="privacy-sections-card privacy-reveal" style={{ "--privacy-delay": "150ms" }}>
              {sections.map((section, index) => (
                <details id={section.id} key={section.id} open={index === 0}>
                  <summary>
                    <span className="privacy-section-icon"><PrivacyIcon type={section.icon} /></span>
                    <span className="privacy-section-heading">
                      <strong>{section.title}</strong>
                      <small>{section.text}</small>
                    </span>
                    <span className="privacy-chevron" aria-hidden="true" />
                  </summary>
                  <div className="privacy-section-detail">
                    <p>{section.text}</p>
                  </div>
                </details>
              ))}
            </section>

            <aside className="privacy-policy-aside">
              <section className="privacy-rights-card privacy-reveal" style={{ "--privacy-delay": "210ms" }}>
                <span className="privacy-icon-bubble is-light"><PrivacyIcon type="shield" /></span>
                <span className="privacy-side-label">Vos droits</span>
                <h2>Vous gardez le contrôle.</h2>
                <ul>
                  <li>Accéder à vos informations</li>
                  <li>Corriger des données inexactes</li>
                  <li>Demander la suppression du compte</li>
                </ul>
                <Link className="privacy-light-button" to="/support">Demander l’accès</Link>
              </section>

              <section className="privacy-resource-card privacy-reveal" style={{ "--privacy-delay": "260ms" }}>
                <span className="privacy-side-label">Ressources utiles</span>
                <Link to="/return-policy">Retours et remboursements <span aria-hidden="true">→</span></Link>
                <Link to="/support">Contacter ShopSphere <span aria-hidden="true">→</span></Link>
              </section>
            </aside>
          </div>

          <section className="privacy-policy-cta privacy-reveal" style={{ "--privacy-delay": "300ms" }}>
            <span className="privacy-icon-bubble"><PrivacyIcon type="support" /></span>
            <div>
              <h2>Une question sur vos données&nbsp;?</h2>
              <p>Notre équipe répond avec clarté et confidentialité.</p>
            </div>
            <div className="privacy-cta-actions">
              <Link className="privacy-primary-button" to="/support">Contacter le support</Link>
              <Link className="privacy-secondary-button" to="/">Retour à l’accueil</Link>
            </div>
          </section>

          <p className="privacy-policy-note">
            Cette page est fournie à titre informatif et peut être adaptée selon la
            politique réelle de la boutique.
          </p>
        </div>
      </div>
    </main>
  );
}
