import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import { AsyncState } from "../components/ui";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await http.get("/categories");
      setCategories(response.data);
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <section className="page categories-page">
      {/* ============================================================
          PARTIE À ÉLIMINER (catalog-hero)
          ============================================================ */}
      {/*
      <div className="catalog-hero">
        <div>
          <span className="section-kicker">Explorer par univers</span>
          <h1>Catégories</h1>
          <p>Découvrez des collections monochromes sélectionnées pour votre quotidien.</p>
        </div>
      </div>
      */}

      <div className="categories-catalog-grid">
        <AsyncState
          empty={categories.length === 0}
          emptyDescription="Les catégories actives apparaîtront ici."
          emptyTitle="Aucune catégorie disponible"
          error={error}
          loading={loading}
          onRetry={loadCategories}
        >
          {categories.map((category, index) => (
            <Link
              className="category-showcase-card reveal-card"
              key={category.id}
              to={`/products?categoryId=${category.id}`}
              style={{ animationDelay: `${0.06 + index * 0.05}s` }}
            >
              <div className="category-showcase-image">
                {category.imageUrl ? <img src={category.imageUrl} alt={category.name} /> : <span>{category.name}</span>}
              </div>
              <div className="category-showcase-copy">
                <span>{category.productCount ?? 0} produits</span>
                <h2>{category.name}</h2>
                <p>{category.description ?? "Des essentiels premium pour une garde-robe quotidienne épurée."}</p>
              </div>
            </Link>
          ))}
        </AsyncState>
      </div>
    </section>
  );
}