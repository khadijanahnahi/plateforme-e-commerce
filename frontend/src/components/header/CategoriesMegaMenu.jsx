import { Link } from "react-router-dom";
import CategoryMenuContent from "./CategoryMenuContent";

export default function CategoriesMegaMenu({
  categories,
  error,
  isLoading,
  onNavigate,
  onRetry,
}) {
  return (
    <div className="client-categories-mega-layout">
      <div className="client-mega-intro">
        <p className="client-mega-eyebrow">Explorer par univers</p>
        <h2>Des catégories utiles, uniquement lorsqu'elles contiennent des produits.</h2>
        <Link onClick={onNavigate} to="/categories">Toutes les catégories →</Link>
      </div>
      <CategoryMenuContent
        categories={categories}
        error={error}
        isLoading={isLoading}
        limit={8}
        onNavigate={onNavigate}
        onRetry={onRetry}
      />
    </div>
  );
}

