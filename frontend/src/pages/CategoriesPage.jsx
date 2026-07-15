import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import http from "../api/http";
import { AsyncState } from "../components/ui";

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function CategoriesPage() {
  const {
    data: categories = [],
    error,
    isLoading: loading,
    refetch: loadCategories,
  } = useQuery({
    queryKey: ["public", "categories"],
    queryFn: async () => {
      const response = await http.get("/categories");
      return normalizeListResponse(response.data);
    },
  });

  return (
    <section className="page categories-page">
      <div className="catalog-hero">
        <div>
          <span className="section-kicker">Explorer par univers</span>
          <h1>Categories</h1>
          <p>Decouvrez des collections monochromes selectionnees pour votre quotidien.</p>
        </div>
      </div>

      <div className="categories-catalog-grid">
        <AsyncState
          empty={categories.length === 0}
          emptyDescription="Les categories actives apparaitront ici."
          emptyTitle="Aucune categorie disponible"
          error={error?.response?.data?.message ?? (error ? "Impossible de charger les categories." : "")}
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
                <p>{category.description ?? "Des essentiels premium pour une garde-robe quotidienne epuree."}</p>
              </div>
            </Link>
          ))}
        </AsyncState>
      </div>
    </section>
  );
}
