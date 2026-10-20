import { Link } from "react-router-dom";

function CategorySkeleton() {
  return (
    <div className="client-category-menu-grid" aria-label="Chargement des catégories" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="client-category-menu-card is-skeleton" key={index}>
          <span />
          <div><strong /><small /></div>
        </div>
      ))}
    </div>
  );
}

export default function CategoryMenuContent({
  categories,
  error,
  isLoading,
  limit = 6,
  onNavigate,
  onRetry,
}) {
  if (isLoading) return <CategorySkeleton />;

  if (error) {
    return (
      <div className="client-mega-state" role="alert">
        <strong>Catégories indisponibles</strong>
        <span>Le catalogue ne peut pas être chargé pour le moment.</span>
        <button type="button" onClick={onRetry}>Réessayer</button>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="client-mega-state">
        <strong>Aucune catégorie disponible</strong>
        <span>Les univers contenant des produits apparaîtront ici.</span>
      </div>
    );
  }

  return (
    <div className="client-category-menu-grid">
      {categories.slice(0, limit).map((category, index) => (
        <Link
          className="client-category-menu-card"
          key={category.id}
          onClick={onNavigate}
          to={`/products?categoryId=${category.id}`}
        >
          <span className="client-category-menu-media">
            {category.imageUrl ? (
              <img alt="" loading="lazy" src={category.imageUrl} />
            ) : (
              <strong aria-hidden="true">{String(index + 1).padStart(2, "0")}</strong>
            )}
          </span>
          <span>
            <strong>{category.name}</strong>
            <small>{category.productCount} produit{Number(category.productCount) > 1 ? "s" : ""}</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      ))}
    </div>
  );
}

