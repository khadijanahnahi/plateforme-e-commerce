import { Link } from "react-router-dom";

const sections = [
  {
    title: "Présentation de ShopSphere",
    text: "ShopSphere est une boutique e-commerce dédiée aux essentiels monochromes premium. Le site permet de consulter les produits, créer un compte, passer commande et suivre les achats.",
  },
  {
    title: "Utilisation du site",
    text: "L'utilisateur s'engage à utiliser le site de manière normale, légale et respectueuse. Toute tentative de fraude, d'accès non autorisé ou de perturbation du service peut entraîner une restriction d'accès.",
  },
  {
    title: "Création de compte",
    text: "Certaines fonctionnalités nécessitent un compte client. Les informations fournies doivent être exactes afin de permettre le traitement des commandes, la livraison et le support.",
  },
  {
    title: "Produits et disponibilité",
    text: "Les produits affichés peuvent varier selon le stock disponible. Un produit peut être modifié, désactivé ou archivé sans suppression des historiques de commandes.",
  },
  {
    title: "Commandes",
    text: "Toute commande validée est enregistrée avec ses informations au moment de l'achat : produits, prix, coordonnées client et adresse de livraison.",
  },
  {
    title: "Prix",
    text: "Les prix sont affichés en dirhams marocains lorsque cela est applicable. Les promotions et réductions sont recalculées côté serveur avant validation de la commande.",
  },
  {
    title: "Paiement à la livraison",
    text: "ShopSphere utilise le paiement à la livraison pour ce MVP. Le client règle le montant total au moment de la réception de la commande.",
  },
  {
    title: "Livraison",
    text: "Les délais de livraison indiqués sont estimatifs. Ils peuvent varier selon la ville, la disponibilité du produit et les contraintes du transporteur.",
  },
  {
    title: "Responsabilité",
    text: "ShopSphere met en place des mesures raisonnables pour assurer la disponibilité du service, mais ne peut garantir une absence totale d'interruptions ou d'erreurs techniques.",
  },
  {
    title: "Propriété intellectuelle",
    text: "Les textes, visuels, interfaces, logos et éléments de marque du site sont protégés. Toute reproduction non autorisée est interdite.",
  },
  {
    title: "Modification des conditions",
    text: "Ces conditions peuvent être mises à jour afin de refléter l'évolution de la boutique, des services ou des obligations légales.",
  },
  {
    title: "Contact",
    text: "Pour toute question concernant ces conditions, contactez le support ShopSphere via la page Support.",
  },
];

export default function TermsPage() {
  return (
    <section className="legal-page">
      <div className="page legal-shell">
        <div className="legal-card">
          <span className="section-kicker">Cadre légal</span>
          <h1>Conditions d'utilisation</h1>
          <p className="legal-intro">
            Ces conditions définissent les règles générales d'utilisation de la
            boutique ShopSphere et de ses services e-commerce.
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
