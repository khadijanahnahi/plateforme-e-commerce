import { Link } from "react-router-dom";

const commitments = [
  {
    number: "01",
    title: "Excellence rigoureuse",
    description: "Chaque article est rigoureusement évalué pour son design, sa finition et sa durabilité.",
  },
  {
    number: "02",
    title: "Parcours intuitif",
    description: "Une navigation épurée, un panier instantané, le paiement à la livraison et un suivi en temps réel.",
  },
  {
    number: "03",
    title: "Transparence totale",
    description: "Confirmations instantanées, facturation automatisée et un support dédié à votre écoute.",
  },
  {
    number: "04",
    title: "Identité monochrome",
    description: "Une signature visuelle sobre et intemporelle : noir, blanc, crème et nuances bordeaux.",
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
    title: "Achat fluide",
    description: "Un cheminement direct et rapide, de la découverte de l'article à la validation finale.",
  },
  {
    index: "B",
    title: "Suivi limpide",
    description: "Des notifications par email pertinentes et des statuts transparents à chaque étape clé.",
  },
  {
    index: "C",
    title: "Accompagnement dédié",
    description: "Une équipe réactive et à votre disposition pour vous guider avant, pendant et après votre commande.",
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
            ShopSphere réunit une sélection premium, pensée pour durer et pour s'intégrer
            naturellement à votre quotidien — avec une expérience d'achat fluide, rapide
            et d'une clarté absolue.
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
            Né à Fès, ShopSphere est un studio e-commerce guidé par l'amour des lignes
            épurées et des matières de choix. Notre vocation est de façonner une sélection
            capsule, pensée pour sublimer votre quotidien avec justesse, élégance et
            durabilité.
          </p>
        </article>
        <article className="about-editorial-card about-editorial-dark about-reveal" style={{ "--about-delay": "0.12s" }}>
          <span className="about-section-number">02 / Direction</span>
          <h2>Notre vision</h2>
          <p>
            Nous croyons qu'une expérience e-commerce d'exception va bien au-delà de
            l'achat. Elle repose sur un parcours sans couture et dénué de toute friction :
            de la découverte d'un article à sa réception, chaque étape est pensée pour être
            limpide, intuitive et rassurante.
          </p>
        </article>
      </section>

      <section className="page about-section about-reveal">
        <div className="about-section-heading">
          <div>
            <span className="section-kicker">Nos engagements</span>
            <h2>Des choix évidents, une exigence constante</h2>
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
            <h2>L'essentiel, l'esprit libre</h2>
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
          <h2>Prêt à découvrir l'univers ShopSphere ?</h2>
          <p>
            Explorez une sélection exclusive, pensée pour ceux qui recherchent
            la modernité dans la sobriété.
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
