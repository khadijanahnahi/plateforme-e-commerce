import { Link } from "react-router-dom";

const commitments = [
  {
    number: "01",
    title: "Qualité sélectionnée",
    description: "Chaque produit est choisi pour son design, sa finition et son utilité.",
  },
  {
    number: "02",
    title: "Expérience simple",
    description: "Navigation claire, panier rapide, paiement à la livraison et suivi de commande.",
  },
  {
    number: "03",
    title: "Confiance client",
    description: "Emails de confirmation, facture PDF, support client et avis vérifiés.",
  },
  {
    number: "04",
    title: "Style monochrome",
    description: "Une identité sobre : noir, blanc, crème et détails bordeaux.",
  },
];

const highlights = [
  { value: "120+", label: "Articles premium" },
  { value: "48h", label: "Livraison express" },
  { value: "4.9/5", label: "Satisfaction client" },
  { value: "COD", label: "Paiement à la livraison" },
];

const processSteps = [
  "Sélection produit",
  "Vérification stock",
  "Confirmation commande",
  "Préparation",
  "Livraison",
  "Avis vérifié",
];

const reasons = [
  {
    index: "A",
    title: "Commande simple",
    description: "Un parcours direct, du choix du produit à la confirmation de votre commande.",
  },
  {
    index: "B",
    title: "Suivi clair",
    description: "Des statuts lisibles et des emails utiles à chaque étape importante.",
  },
  {
    index: "C",
    title: "Support disponible",
    description: "Une équipe accessible pour répondre à vos questions avant et après l’achat.",
  },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="page about-hero about-reveal">
        <div className="about-hero-copy">
          <span className="section-kicker">ShopSphere Brand</span>
          <h1>Une boutique pensée pour <em>l’élégance</em> du quotidien</h1>
          <p>
            ShopSphere sélectionne des pièces monochromes, modernes et faciles à porter,
            avec une expérience d’achat simple, rapide et fiable.
          </p>
          <div className="about-actions">
            <Link className="about-button about-button-primary" to="/products">
              Découvrir la collection <span aria-hidden="true">→</span>
            </Link>
            <Link className="about-button about-button-secondary" to="/categories">
              Explorer les catégories
            </Link>
          </div>
          <div className="about-badges" aria-label="Services ShopSphere">
            <span>Mode premium</span>
            <span>Paiement à la livraison</span>
            <span>Livraison express</span>
            <span>Produits sélectionnés</span>
          </div>
        </div>

        <div className="about-hero-art" aria-hidden="true">
          <div className="about-art-orbit about-art-orbit-one" />
          <div className="about-art-orbit about-art-orbit-two" />
          <span className="about-art-label">Minimal</span>
          <strong>S<span>•</span>S</strong>
          <p>Monochrome essentials</p>
          <small>Fès · Maroc</small>
        </div>
      </section>

      <section className="page about-story-grid">
        <article className="about-editorial-card about-reveal" style={{ "--about-delay": "0.05s" }}>
          <span className="about-section-number">01 / Origine</span>
          <h2>Notre histoire</h2>
          <p>
            ShopSphere est une boutique e-commerce orientée vers une esthétique minimaliste
            et premium. Notre objectif est de proposer des produits mode et accessoires
            soigneusement sélectionnés, pensés pour accompagner le quotidien avec simplicité,
            élégance et durabilité.
          </p>
        </article>
        <article className="about-editorial-card about-editorial-dark about-reveal" style={{ "--about-delay": "0.12s" }}>
          <span className="about-section-number">02 / Direction</span>
          <h2>Notre vision</h2>
          <p>
            Nous croyons qu’une bonne boutique en ligne ne doit pas seulement vendre des
            produits. Elle doit offrir une expérience claire, rassurante et fluide : découvrir,
            choisir, commander, suivre et recevoir ses articles sans complexité.
          </p>
        </article>
      </section>

      <section className="page about-section about-reveal">
        <div className="about-section-heading">
          <div>
            <span className="section-kicker">Nos engagements</span>
            <h2>Des choix simples, une exigence constante</h2>
          </div>
          <p>Une expérience cohérente avant, pendant et après chaque commande.</p>
        </div>
        <div className="about-commitment-grid">
          {commitments.map((item, index) => (
            <article
              className="about-commitment-card"
              key={item.title}
              style={{ "--about-delay": `${0.06 * index}s` }}
            >
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page about-metrics about-reveal" aria-label="ShopSphere en chiffres">
        {highlights.map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="page about-section about-process-section about-reveal">
        <div className="about-section-heading">
          <div>
            <span className="section-kicker">Le processus ShopSphere</span>
            <h2>De la sélection à votre expérience</h2>
          </div>
          <p>Chaque étape est pensée pour rester compréhensible, fiable et traçable.</p>
        </div>
        <ol className="about-timeline">
          {processSteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="page about-section about-reveal">
        <div className="about-section-heading">
          <div>
            <span className="section-kicker">Pourquoi ShopSphere</span>
            <h2>L’essentiel, sans complexité</h2>
          </div>
        </div>
        <div className="about-reasons-grid">
          {reasons.map((reason) => (
            <article key={reason.title}>
              <span>{reason.index}</span>
              <h3>{reason.title}</h3>
              <p>{reason.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page about-final-cta about-reveal">
        <div>
          <span className="section-kicker">La collection vous attend</span>
          <h2>Prêt à découvrir l’univers ShopSphere ?</h2>
          <p>
            Explorez une sélection de pièces premium pensées pour un style simple,
            moderne et durable.
          </p>
        </div>
        <div className="about-actions">
          <Link className="about-button about-button-light" to="/products">Voir les produits</Link>
          <Link className="about-button about-button-dark-outline" to="/support">Contacter le support</Link>
        </div>
      </section>
    </div>
  );
}
