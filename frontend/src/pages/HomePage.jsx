import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import heroMonochrome from "../../images/hero-monochrome.png";

const fallbackCategories = [
  {
    name: "Essentiels monochromes",
    description: "Pièces nettes, textures propres et coupes contemporaines.",
    itemCount: "42 pièces",
  },
  {
    name: "Sneakers minimalistes",
    description: "Silhouettes blanches, gris graphite et détails premium.",
    itemCount: "18 modèles",
  },
  {
    name: "Accessoires",
    description: "Sacs, montres et essentiels au rendu soigné.",
    itemCount: "27 sélections",
  },
  {
    name: "Éditions limitées",
    description: "Drops saisonniers et pièces rares à forte identité.",
    itemCount: "11 nouveautés",
  },
];

const flashProducts = [
  {
    name: "Graphite Hoodie",
    price: "720 DH",
    oldPrice: "1180 DH",
    sold: 82,
    sales: "82 ventes",
    badge: "Hoodie",
  },
  {
    name: "White Arc Sneakers",
    price: "1240 DH",
    oldPrice: "1790 DH",
    sold: 64,
    sales: "64 ventes",
    badge: "Sneakers",
  },
  {
    name: "Midnight Crossbody",
    price: "890 DH",
    oldPrice: "1340 DH",
    sold: 73,
    sales: "73 ventes",
    badge: "Sac",
  },
  {
    name: "Noir Ceramic Watch",
    price: "1460 DH",
    oldPrice: "2100 DH",
    sold: 58,
    sales: "58 ventes",
    badge: "Montre",
  },
];

const recommendedProducts = [
  {
    name: "Clean Line Tee",
    price: "340 DH",
    details: "Coton organique, coupe régulière, blanc pierre.",
  },
  {
    name: "Tailored Track Pants",
    price: "680 DH",
    details: "Profil relax avec finition noire mate.",
  },
  {
    name: "Studio Tote",
    price: "920 DH",
    details: "Sac structure en texture grain doux.",
  },
  {
    name: "Frame Shades",
    price: "560 DH",
    details: "Lunettes monochromes nettes pour le quotidien.",
  },
];

const stores = [
  {
    name: "Atelier Noir",
    tagline: "Essentiels fashion",
    rating: "4.9",
  },
  {
    name: "North Form",
    tagline: "Basics urbains premium",
    rating: "4.8",
  },
  {
    name: "Silver Thread",
    tagline: "Pièces minimalistes",
    rating: "4.7",
  },
];

const heroHeadline = ["Élevez votre", "allure"];

function splitHeroTitle(title) {
  if (!title) {
    return heroHeadline;
  }

  return title.split(" ").reduce((lines, word) => {
    const lastLine = lines[lines.length - 1] ?? "";
    if (!lastLine || lastLine.length + word.length > 16) {
      return [...lines, word];
    }
    return [...lines.slice(0, -1), `${lastLine} ${word}`];
  }, []);
}

function localizeHeroTitle(title) {
  if (!title) {
    return title;
  }

  const normalizedTitle = title.trim().toLowerCase();
  if (normalizedTitle === "elevate your style") {
    return "Élevez votre allure";
  }

  return title;
}

function localizeHeroButtonText(text) {
  if (!text) {
    return "Découvrir la collection";
  }

  const normalizedText = text.trim().toLowerCase().replace(/\s*->\s*$/, "");
  if (normalizedText === "shop collection" || normalizedText === "shop now") {
    return "Découvrir la collection";
  }

  return text;
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

export default function HomePage() {
  const [heroBanners, setHeroBanners] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [homeCategories, setHomeCategories] = useState(fallbackCategories);

  useEffect(() => {
    let mounted = true;

    async function loadHeroBanner() {
      try {
        const response = await http.get("/banners", {
          params: { placement: "HOME_HERO" },
        });
        if (mounted) {
          setHeroBanners(normalizeListResponse(response.data));
          setHeroLoaded(true);
        }
      } catch {
        if (mounted) {
          setHeroBanners([]);
          setHeroLoaded(true);
        }
      }
    }

    loadHeroBanner();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const response = await http.get("/categories");
        const categories = normalizeListResponse(response.data);
        if (mounted && categories.length) {
          setHomeCategories(categories.slice(0, 4));
        }
      } catch {
        if (mounted) {
          setHomeCategories(fallbackCategories);
        }
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (heroBanners.length < 2) {
      setActiveHeroIndex(0);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroBanners.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [heroBanners.length]);

  const heroBanner = heroBanners[activeHeroIndex] ?? null;
  const shouldUseDefaultHero = heroLoaded && !heroBanner;
  const heroLines = !heroLoaded ? [] : shouldUseDefaultHero ? heroHeadline : splitHeroTitle(localizeHeroTitle(heroBanner?.title));
  const heroImage = shouldUseDefaultHero ? heroMonochrome : heroBanner?.imageUrl;
  const primaryTarget = heroBanner?.targetUrl || "/products";
  const primaryText = localizeHeroButtonText(heroBanner?.buttonText);
  const hasHeroSlider = heroBanners.length > 1;

  return (
    <div className="home-page">
      <section className="page hero-section">
        <div className={`hero-card ${hasHeroSlider ? "hero-card-carousel" : ""}`} key={heroBanner?.id ?? "default-hero"}>
          <div className="hero-copy">
            <span className="eyebrow">{heroBanner ? "Campagne en vedette" : "Édition premium"}</span>
            <div className="hero-headline">
              {heroLines.map((line, index) => (
                <span
                  className="hero-line"
                  key={`${line}-${index}`}
                  style={{ animationDelay: `${0.15 + index * 0.15}s` }}
                >
                  {line}
                </span>
              ))}
            </div>
            <p className="hero-description">
              {heroBanner?.subtitle ||
                "Des essentiels monochromes pensés pour chaque saison. Découvrez des pièces premium, durables et faciles à porter au quotidien."}
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to={primaryTarget}>
                {primaryText} <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-secondary" to="/categories">
                Explorer les catégories
              </Link>
            </div>
            <div className="hero-stats" aria-label="Indicateurs ShopSphere">
              <div>
                <strong>4.9/5</strong>
                <span>Satisfaction client</span>
              </div>
              <div>
                <strong>48h</strong>
                <span>Livraison express</span>
              </div>
              <div>
                <strong>120+</strong>
                <span>Pièces exclusives</span>
              </div>
            </div>
            {hasHeroSlider ? (
              <div className="hero-slider-dots" aria-label="Navigation des bannières">
                {heroBanners.map((banner, index) => (
                  <button
                    className={`dot ${index === activeHeroIndex ? "dot-active" : ""}`}
                    key={banner.id}
                    type="button"
                    aria-label={`Afficher la bannière ${index + 1}`}
                    onClick={() => setActiveHeroIndex(index)}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="hero-visual">
            {heroImage ? <img src={heroImage} alt={heroBanner?.title || "ShopSphere monochrome essentials"} /> : null}
            <span className="hero-floating-chip chip-one">Nouveau drop</span>
            <span className="hero-floating-chip chip-two">Paiement à la livraison</span>
          </div>
        </div>
      </section>

      <section className="page section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Catégories</span>
            <h2>Une garde-robe pensée pièce par pièce</h2>
          </div>
          <p>Des univers courts, lisibles et orientés conversion pour une boutique premium.</p>
        </div>
        <div className="category-grid">
          {homeCategories.map((category, index) => (
            <Link
              className="category-card reveal-card"
              key={category.id ?? category.name}
              to={category.id ? `/products?categoryId=${category.id}` : "/categories"}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <span className="category-index">0{index + 1}</span>
              <h3>{category.name}</h3>
              <p>{category.description ?? "Essentiels premium sélectionnés pour une garde-robe nette."}</p>
              <strong>
                {category.productCount !== undefined ? `${category.productCount} produits` : category.itemCount}
              </strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="page section-block">
        <div className="section-heading flash-header">
          <div>
            <span className="section-kicker">Flash Sale</span>
            <h2>Drops limités, stocks en mouvement</h2>
          </div>
          <div className="flash-toolbar">
            <div className="countdown">
              <span>08</span>
              <span>17</span>
              <span>56</span>
            </div>
            <div className="carousel-controls">
              <button type="button" aria-label="Produits précédents">
                &lt;
              </button>
              <button type="button" aria-label="Produits suivants">
                &gt;
              </button>
            </div>
          </div>
        </div>
        <div className="flash-grid">
          {flashProducts.map((product, index) => (
            <article
              className="product-card reveal-card"
              key={product.name}
              style={{ animationDelay: `${0.12 + index * 0.08}s` }}
            >
              <div className="product-image">
                <span className="favorite-chip">Favori</span>
                <div className="product-placeholder">
                  <span>{product.badge}</span>
                </div>
              </div>
              <div className="product-copy">
                <h3>{product.name}</h3>
                <div className="price-row">
                  <strong>{product.price}</strong>
                  <span>{product.oldPrice}</span>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <div className="progress-fill" style={{ width: `${product.sold}%` }} />
                </div>
                <div className="product-meta">
                  <small>{product.sales}</small>
                  <button className="inline-cart" type="button">
                    Ajouter
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Sélection</span>
            <h2>Des pièces choisies pour votre quotidien</h2>
          </div>
          <p>Une sélection éditoriale pour garder la boutique claire, premium et orientée achat.</p>
        </div>
        <div className="recommended-grid">
          {recommendedProducts.map((product, index) => (
            <article
              className="recommended-card reveal-card"
              key={product.name}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="recommended-visual">
                <span>{product.name.split(" ")[0]}</span>
              </div>
              <div className="recommended-copy">
                <h3>{product.name}</h3>
                <p>{product.details}</p>
                <div className="recommended-footer">
                  <strong>{product.price}</strong>
                  <button type="button">Voir produit</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Boutiques</span>
            <h2>Des marques avec une vraie identité visuelle</h2>
          </div>
          <p>Des univers partenaires cohérents avec l'ambiance premium ShopSphere.</p>
        </div>
        <div className="stores-grid">
          {stores.map((store, index) => (
            <article
              className="store-card reveal-card"
              key={store.name}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="store-mark">{store.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <h3>{store.name}</h3>
                <p>{store.tagline}</p>
              </div>
              <strong>{store.rating}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="page section-block">
        <div className="final-banner">
          <div>
            <span className="section-kicker">Dernier appel</span>
            <h2>Construisez une silhouette plus nette avec moins de pièces, mieux choisies.</h2>
          </div>
          <div className="banner-actions">
            <Link className="button button-primary" to="/products">
              Découvrir
            </Link>
            <Link className="button button-secondary" to="/categories">
              Voir les collections
            </Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page footer-content">
          <div className="footer-brand">
            <strong>ShopSphere</strong>
            <p>Essentiels monochromes premium pour un style moderne au quotidien.</p>
          </div>

          <div className="footer-column">
            <h3>Boutique</h3>
            <div className="footer-links">
              <Link to="/products">Produits</Link>
              <Link to="/categories">Catégories</Link>
              <Link to="/products?sort=new">Nouveautés</Link>
              <Link to="/products?sort=best">Meilleures ventes</Link>
            </div>
          </div>

          <div className="footer-column">
            <h3>Client</h3>
            <div className="footer-links">
              <Link to="/orders">Mes commandes</Link>
              <Link to="/cart">Panier</Link>
              <a href="/#wishlist">Favoris</a>
              <Link to="/support">Support</Link>
            </div>
          </div>

          <div className="footer-column">
            <h3>Marque</h3>
            <div className="footer-links">
              <a href="/#about">À propos</a>
              <Link to="/support">Contact</Link>
              <a href="/#terms">Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
