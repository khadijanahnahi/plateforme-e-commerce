import { Link } from "react-router-dom";

const sections = [
  {
    title: "Données collectées",
    text: "ShopSphere peut collecter le nom, l'email, le téléphone, l'adresse de livraison, les commandes, les avis produits, la wishlist et les informations nécessaires au fonctionnement du compte.",
  },
  {
    title: "Utilisation des données",
    text: "Les données sont utilisées pour gérer le compte client, traiter les commandes, organiser la livraison, envoyer les emails transactionnels, répondre au support et améliorer l'expérience boutique.",
  },
  {
    title: "Sécurité",
    text: "Les mots de passe sont hashés côté serveur. En production, l'accès au site doit être protégé par HTTPS et les accès sensibles doivent rester sécurisés.",
  },
  {
    title: "Partage limité",
    text: "Les informations peuvent être partagées uniquement lorsque cela est nécessaire au traitement de la commande, par exemple avec un livreur ou un prestataire logistique.",
  },
  {
    title: "Cookies et stockage local",
    text: "Le site peut utiliser des cookies sécurisés pour maintenir la session et le stockage local uniquement pour certaines préférences d'affichage.",
  },
  {
    title: "Emails transactionnels",
    text: "ShopSphere peut envoyer des emails liés aux commandes, changements de statut, factures, réinitialisation de mot de passe ou demandes de support.",
  },
  {
    title: "Droits utilisateur",
    text: "Selon la réglementation applicable, l'utilisateur peut demander l'accès, la correction, la suppression ou l'opposition au traitement de certaines données personnelles.",
  },
  {
    title: "Conservation",
    text: "Les données liées aux commandes peuvent être conservées pour assurer le suivi commercial, la livraison, les factures et l'historique client.",
  },
  {
    title: "Contact support",
    text: "Pour toute demande relative aux données personnelles, contactez ShopSphere via la page Support.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <section className="legal-page">
      <div className="page legal-shell">
        <div className="legal-card">
          <span className="section-kicker">Données personnelles</span>
          <h1>Politique de confidentialité</h1>
          <p className="legal-intro">
            Cette politique explique comment ShopSphere collecte, utilise et
            protège les informations nécessaires à l'expérience e-commerce.
          </p>

          <div className="legal-section-list">
            {sections.map((section) => (
              <article className="legal-section" key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </article>
            ))}
          </div>

          <div className="legal-note">
            Cette page est fournie à titre informatif et peut être adaptée selon
            la politique réelle de la boutique.
          </div>

          <div className="legal-actions">
            <Link className="button button-primary" to="/support">Contacter le support</Link>
            <Link className="button button-secondary" to="/">Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
