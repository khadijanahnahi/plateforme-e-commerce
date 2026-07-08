import { Link } from "react-router-dom";

const shopLinks = [
  { label: "Produits", to: "/products" },
  { label: "Catégories", to: "/categories" },
  { label: "Nouveautés", to: "/products?sort=new" },
  { label: "Meilleures ventes", to: "/products?sort=best" },
];

const customerLinks = [
  { label: "Mes commandes", to: "/orders" },
  { label: "Panier", to: "/cart" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Support", to: "/support" },
];

const legalLinks = [
  { label: "Conditions", to: "/terms" },
  { label: "Confidentialité", to: "/privacy-policy" },
  { label: "Retours", to: "/return-policy" },
];

const serviceBadges = ["Paiement à la livraison", "Livraison express 48h", "Support client"];

export default function ClientFooter() {
  return (
    <footer className="site-footer global-footer">
      <div className="footer-orb footer-orb-left" />
      <div className="footer-orb footer-orb-right" />

      <div className="page footer-content footer-content-premium">
        <div className="footer-brand footer-reveal" style={{ "--delay": "0s" }}>
          <Link className="footer-logo" to="/">
            Shop<span>•</span>Sphere
          </Link>
          <p>
            Essentiels monochromes premium pour un style moderne, durable et
            facile à porter au quotidien.
          </p>
          <div className="footer-badges">
            {serviceBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>

        <nav className="footer-column footer-reveal" style={{ "--delay": "0.08s" }}>
          <h3>Boutique</h3>
          <div className="footer-links">
            {shopLinks.map((link) => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
          </div>
        </nav>

        <nav className="footer-column footer-reveal" style={{ "--delay": "0.16s" }}>
          <h3>Client</h3>
          <div className="footer-links">
            {customerLinks.map((link) => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
          </div>
        </nav>

        <nav className="footer-column footer-reveal" style={{ "--delay": "0.24s" }}>
          <h3>Légal</h3>
          <div className="footer-links">
            {legalLinks.map((link) => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
          </div>
        </nav>

        <form
          className="footer-newsletter footer-reveal"
          style={{ "--delay": "0.32s" }}
          onSubmit={(event) => event.preventDefault()}
        >
          <h3>Newsletter</h3>
          <p>Recevez les nouveaux drops, offres membres et sélections premium.</p>
          <div>
            <input type="email" placeholder="Votre email" aria-label="Votre email" />
            <button type="submit">S'abonner</button>
          </div>
        </form>
      </div>

      <div className="page footer-bottom">
        <span>© {new Date().getFullYear()} ShopSphere. Tous droits réservés.</span>
        <span>Premium monochrome essentials.</span>
      </div>
    </footer>
  );
}
