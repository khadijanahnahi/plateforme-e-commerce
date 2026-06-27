const categories = [
  {
    name: "Monochrome Wear",
    description: "Pieces nettes, textures propres et coupes contemporaines.",
    itemCount: "42 pieces",
  },
  {
    name: "Sneaker Edit",
    description: "Silhouettes blanches, gris graphite et details minimalistes.",
    itemCount: "18 models",
  },
  {
    name: "Accessories",
    description: "Sacs, montres et essentials au rendu premium.",
    itemCount: "27 picks",
  },
  {
    name: "Office Tech",
    description: "Objets quotidiens au design discret et haut de gamme.",
    itemCount: "11 launches",
  },
];

const flashProducts = [
  {
    name: "Graphite Hoodie",
    price: "$72",
    oldPrice: "$118",
    sold: 82,
    sales: "82 sold",
    badge: "Hoodie",
  },
  {
    name: "White Arc Sneakers",
    price: "$124",
    oldPrice: "$179",
    sold: 64,
    sales: "64 sold",
    badge: "Sneakers",
  },
  {
    name: "Midnight Crossbody",
    price: "$89",
    oldPrice: "$134",
    sold: 73,
    sales: "73 sold",
    badge: "Bag",
  },
  {
    name: "Noir Ceramic Watch",
    price: "$146",
    oldPrice: "$210",
    sold: 58,
    sales: "58 sold",
    badge: "Watch",
  },
];

const recommendedProducts = [
  {
    name: "Clean Line Tee",
    price: "$34",
    details: "Organic cotton, regular fit, stone white.",
  },
  {
    name: "Tailored Track Pants",
    price: "$68",
    details: "Relaxed profile with matte black finish.",
  },
  {
    name: "Studio Tote",
    price: "$92",
    details: "Structured carryall in soft grain texture.",
  },
  {
    name: "Frame Shades",
    price: "$56",
    details: "Sharp monochrome eyewear for daily wear.",
  },
];

const stores = [
  {
    name: "Atelier Noir",
    tagline: "Fashion essentials",
    rating: "4.9",
  },
  {
    name: "North Form",
    tagline: "Urban premium basics",
    rating: "4.8",
  },
  {
    name: "Silver Thread",
    tagline: "Minimal craft pieces",
    rating: "4.7",
  },
];

const heroHeadline = [
  "Big Fashion Sale",
  "Limited Time Offer!",
  "Up to 50% OFF!",
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="page hero-section">
        <div className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">Redefine Your Everyday Style</span>
            <div className="hero-headline">
              {heroHeadline.map((line, index) => (
                <span
                  className="hero-line"
                  key={line}
                  style={{ animationDelay: `${0.15 + index * 0.15}s` }}
                >
                  {line}
                </span>
              ))}
            </div>
            <p className="hero-description">
              ShopSphere curates monochrome fashion, refined accessories and
              clean essentials for a modern black and white wardrobe.
            </p>
            <div className="hero-actions">
              <button className="button button-primary" type="button">
                Shop Now
              </button>
              <button className="button button-secondary" type="button">
                Explore Collection
              </button>
            </div>
            <div className="hero-slider-dots" aria-label="Hero navigation">
              <span className="dot dot-active" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>

          <div className="hero-visual">
            <div className="product-stage stage-tall">
              <span>T-Shirt</span>
            </div>
            <div className="product-stage stage-wide">
              <span>Sneakers</span>
            </div>
            <div className="product-stage stage-compact">
              <span>Bag</span>
            </div>
            <div className="product-stage stage-circle">
              <span>Watch</span>
            </div>
          </div>
        </div>
      </section>

      <section className="page section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Categories</span>
            <h2>Shop by mood and silhouette</h2>
          </div>
          <p>Focused categories built for a premium monochrome storefront.</p>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <article
              className="category-card reveal-card"
              key={category.name}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <span className="category-index">0{index + 1}</span>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <strong>{category.itemCount}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="page section-block">
        <div className="section-heading flash-header">
          <div>
            <span className="section-kicker">Flash Sale</span>
            <h2>Limited drops moving fast</h2>
          </div>
          <div className="flash-toolbar">
            <div className="countdown">
              <span>08</span>
              <span>17</span>
              <span>56</span>
            </div>
            <div className="carousel-controls">
              <button type="button" aria-label="Previous flash products">
                &lt;
              </button>
              <button type="button" aria-label="Next flash products">
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
                <span className="favorite-chip">Save</span>
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
                  <div
                    className="progress-fill"
                    style={{ width: `${product.sold}%` }}
                  />
                </div>
                <div className="product-meta">
                  <small>{product.sales}</small>
                  <button className="inline-cart" type="button">
                    Add to Cart
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
            <span className="section-kicker">Recommended</span>
            <h2>Curated for your daily rotation</h2>
          </div>
          <p>Pieces selected to keep the storefront editorial and conversion-led.</p>
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
                  <button type="button">View Product</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page section-block">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Popular Stores</span>
            <h2>Trusted shops with strong visual identity</h2>
          </div>
          <p>Partner storefronts that match the premium tone of ShopSphere.</p>
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
            <span className="section-kicker">Final Call</span>
            <h2>Build a cleaner storefront experience around fewer, better products.</h2>
          </div>
          <div className="banner-actions">
            <button className="button button-primary" type="button">
              Start Shopping
            </button>
            <button className="button button-secondary" type="button">
              View Brands
            </button>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page footer-content">
          <div>
            <strong>ShopSphere</strong>
            <p>Minimal black and white e-commerce for fashion-tech retail.</p>
          </div>
          <div className="footer-links">
            <a href="/#">Collections</a>
            <a href="/#">Flash Sale</a>
            <a href="/#">Stores</a>
            <a href="/#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
