import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const response = await http.get("/categories");
        if (mounted) {
          setCategories(response.data);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load categories.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="page categories-page">
      <div className="catalog-hero">
        <div>
          <span className="section-kicker">Shop by category</span>
          <h1>Categories</h1>
          <p>Explore curated monochrome collections and jump directly into products that match your style.</p>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="categories-catalog-grid">
        {loading ? (
          <div className="admin-panel">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="admin-panel">No categories found.</div>
        ) : categories.map((category, index) => (
          <Link
            className="category-showcase-card reveal-card"
            key={category.id}
            to={`/products?categoryId=${category.id}`}
            style={{ animationDelay: `${0.06 + index * 0.05}s` }}
          >
            <div className="category-showcase-image">
              {category.imageUrl ? (
                <img src={category.imageUrl} alt={category.name} />
              ) : (
                <span>{category.name}</span>
              )}
            </div>
            <div className="category-showcase-copy">
              <span>{category.productCount ?? 0} products</span>
              <h2>{category.name}</h2>
              <p>{category.description ?? "Premium essentials selected for a clean everyday wardrobe."}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
