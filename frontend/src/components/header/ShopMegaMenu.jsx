import { Link } from "react-router-dom";
import { inspirationLinks, shopDiscoveryLinks } from "./navigationConfig";
import CategoryMenuContent from "./CategoryMenuContent";
import MegaMenuColumn from "./MegaMenuColumn";

export default function ShopMegaMenu({
  categories,
  error,
  isLoading,
  onNavigate,
  onRetry,
}) {
  return (
    <div className="client-shop-mega-layout">
      <MegaMenuColumn links={shopDiscoveryLinks} onNavigate={onNavigate} title="Découvrir" />

      <section className="client-mega-column client-mega-categories-column">
        <div className="client-mega-column-heading">
          <p className="client-mega-eyebrow">Catégories</p>
          <Link onClick={onNavigate} to="/categories">Tout voir →</Link>
        </div>
        <CategoryMenuContent
          categories={categories}
          error={error}
          isLoading={isLoading}
          limit={4}
          onNavigate={onNavigate}
          onRetry={onRetry}
        />
      </section>

      <MegaMenuColumn links={inspirationLinks} onNavigate={onNavigate} title="Inspiration" />
    </div>
  );
}

