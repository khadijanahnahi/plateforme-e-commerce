import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import HomeCategoriesCarousel from "../components/category/HomeCategoriesCarousel";
import FlashSaleSection from "../components/product/FlashSaleSection";
import BestSellersSection from "../features/products/BestSellersSection";
import VerifiedReviewsSection from "../features/reviews/VerifiedReviewsSection";
import heroMonochrome from "../../images/hero-monochrome.webp";

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
      <HomeCategoriesCarousel />

      {/*
      <section className="page section-block flash-sale-section">
        <div className="section-heading flash-header">
          <div>
            <span className="section-kicker">Flash Sale</span>
            <h2>Drops limités, stocks en mouvement</h2>
          </div>
          <div className="flash-toolbar">
            <span className="flash-toolbar-label">Fin dans</span>
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
              className={`product-card flash-product-card reveal-card flash-card-${index + 1}`}
              key={product.name}
              style={{ animationDelay: `${0.12 + index * 0.08}s` }}
            >
              <div className="product-image">
                <span className="favorite-chip">Deal</span>
                <span className="flash-discount">
                  -{Math.max(15, 100 - Math.round((parseInt(product.price, 10) / parseInt(product.oldPrice, 10)) * 100))}%
                </span>
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
                    Ajouter au panier
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      */}

      <FlashSaleSection />
      <BestSellersSection />
      <VerifiedReviewsSection />

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

      <footer className="site-footer home-local-footer">
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
              <Link to="/about">À propos</Link>
              <Link to="/support">Contact</Link>
              <Link to="/terms">Conditions</Link>
              <Link to="/privacy-policy">ConfidentialitÃ©</Link>
              <Link to="/return-policy">Retours</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
