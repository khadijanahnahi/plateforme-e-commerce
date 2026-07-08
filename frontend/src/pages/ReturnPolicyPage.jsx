import { Link } from "react-router-dom";

const sections = [
  {
    title: "Conditions de retour",
    text: "Un produit peut être retourné s'il est éligible, non utilisé, dans son état d'origine et accompagné des informations de commande nécessaires.",
  },
  {
    title: "Délai de retour",
    text: "Le délai de retour peut être défini par la boutique selon sa politique réelle. Pour un MVP, un délai indicatif de 7 à 14 jours peut être utilisé.",
  },
  {
    title: "Produits non retournables",
    text: "Certains produits peuvent être exclus du retour pour des raisons d'hygiène, de personnalisation, de dégradation ou de politique commerciale.",
  },
  {
    title: "Produit défectueux",
    text: "Si un produit arrive défectueux ou incorrect, le client doit contacter le support avec le numéro de commande et des preuves visuelles si nécessaire.",
  },
  {
    title: "Échange",
    text: "Un échange peut être proposé selon la disponibilité du stock. Si le produit n'est plus disponible, une autre solution peut être proposée par le support.",
  },
  {
    title: "Annulation de commande",
    text: "Une commande peut être annulée tant qu'elle n'est pas expédiée. Une fois en livraison, l'annulation dépend du statut de traitement et du transporteur.",
  },
  {
    title: "Remboursement",
    text: "Pour le paiement à la livraison, le remboursement dépend du cas réel : retour validé, échange impossible ou erreur de traitement. La boutique définit la méthode applicable.",
  },
  {
    title: "Contact support",
    text: "Pour toute demande de retour, remboursement ou échange, contactez ShopSphere via la page Support en indiquant votre numéro de commande.",
  },
];

export default function ReturnPolicyPage() {
  return (
    <section className="legal-page">
      <div className="page legal-shell">
        <div className="legal-card">
          <span className="section-kicker">Service client</span>
          <h1>Retours et remboursements</h1>
          <p className="legal-intro">
            Cette page présente les règles générales de retour, d'échange et de
            remboursement pour les commandes ShopSphere.
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
