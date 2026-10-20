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

const testimonials = [
  {
    quote: "Livraison rapide, produit conforme aux photos et service client qui répond vraiment. Exactement ce qu'on attend d'une boutique premium.",
    author: "Sara B.",
    role: "Cliente vérifiée",
  },
  {
    quote: "Le paiement à la livraison m'a rassurée pour ma première commande. J'ai pu inspecter le colis avant de payer, aucune mauvaise surprise.",
    author: "Yassine K.",
    role: "Client vérifié",
  },
  {
    quote: "Une identité visuelle sobre et cohérente du site jusqu'au colis reçu. On sent une vraie attention portée aux détails.",
    author: "Imane R.",
    role: "Cliente vérifiée",
  },
];

const faqItems = [
  {
    question: "Puis-je inspecter le colis avant de payer ?",
    answer: "Oui. Avec le paiement à la livraison (COD), vous pouvez vérifier votre colis au moment de la réception, avant de régler le livreur.",
  },
  {
    question: "Comment se passent les retours à Fès et dans les autres villes ?",
    answer: "Un retour peut être demandé depuis votre espace \"Mes commandes\". Notre équipe organise la reprise de l'article et le remboursement une fois celui-ci vérifié.",
  },
  {
    question: "Quels sont les délais de livraison ?",
    answer: "Nous livrons en 48h dans la majorité des villes couvertes. Un suivi de commande en temps réel est disponible depuis votre compte.",
  },
  {
    question: "Comment vous contacter en cas de question ?",
    answer: "Notre équipe support est joignable directement depuis la page Support du site, avant, pendant et après votre commande.",
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
          <div className="about-editorial-media">
            <img
              src="https://images.unsplash.com/photo-1624525005654-c828ed32950d?auto=format&fit=crop&w=900&h=1100&q=80"
              alt="Artisan travaillant minutieusement une pièce à la main"
              loading="lazy"
            />
          </div>
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
          <div className="about-editorial-media">
            <img
              src="https://images.unsplash.com/photo-1705948354026-e3e2e0586f86?auto=format&fit=crop&w=900&h=1100&q=80"
              alt="Transaction fluide et rapide sur tablette"
              loading="lazy"
            />
          </div>
          <h2>Notre vision</h2>
          <p>
            Nous croyons qu'une expérience e-commerce d'exception va bien au-delà de
            l'achat. Elle repose sur un parcours sans couture et dénué de toute friction :
            de la découverte d'un article à sa réception, chaque étape est pensée pour être
            limpide, intuitive et rassurante.
          </p>
        </article>
      </section>

      <section className="page about-founder-note about-reveal">
        <span className="about-section-number">Le mot de l'équipe</span>
        <blockquote>
          « ShopSphere est né d'une conviction simple : le meilleur luxe est celui qui se
          voit à peine — dans la qualité d'une matière, la précision d'une couture, la
          fluidité d'une commande. Chaque pièce que nous sélectionnons passe par un regard
          exigeant avant de vous être proposée. C'est cette rigueur, discrète mais
          constante, que nous mettons chaque jour au service de votre quotidien. »
        </blockquote>
        <cite>— L'équipe ShopSphere, Fès</cite>
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

      <section className="page about-section about-testimonials-section about-reveal">
        <div className="about-section-heading">
          <div>
            <span className="section-kicker">Ils en parlent</span>
            <h2>La confiance de nos clients</h2>
          </div>
          <p>Un aperçu des retours partagés par notre communauté.</p>
        </div>
        <div className="about-testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <figure
              className="about-testimonial-card"
              key={testimonial.author}
              style={{ "--about-delay": `${0.06 * index}s` }}
            >
              <span className="about-testimonial-stars" aria-hidden="true">★★★★★</span>
              <blockquote>{testimonial.quote}</blockquote>
              <figcaption>
                <strong>{testimonial.author}</strong>
                <span>{testimonial.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
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

      <section className="page about-section about-faq-section about-reveal">
        <div className="about-section-heading">
          <div>
            <span className="section-kicker">Questions fréquentes</span>
            <h2>Encore un doute ?</h2>
          </div>
          <p>Les réponses aux questions les plus posées avant une première commande.</p>
        </div>
        <div className="about-faq-list">
          {faqItems.map((item) => (
            <details className="about-faq-item" key={item.question}>
              <summary>
                {item.question}
                <span className="about-faq-icon" aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
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
