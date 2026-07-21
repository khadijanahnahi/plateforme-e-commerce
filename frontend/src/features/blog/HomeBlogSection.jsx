import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { blogApi } from "../../api/blogApi";
import BlogArticleCard from "../../components/blog/BlogArticleCard";
import { ErrorState, Skeleton } from "../../components/ui";

export default function HomeBlogSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await blogApi.getLatest(3);
      setArticles(response.data ?? []);
    } catch {
      setError("Le journal est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!loading && !error && !articles.length) return null;

  return (
    <section className="page section-block home-blog-section">
      <div className="section-heading home-blog-heading">
        <div><span className="section-kicker">Le journal</span><h2>Conseils, matières et silhouettes</h2></div>
        <div><p>Des guides éditoriaux reliés aux pièces réellement disponibles dans la boutique.</p><Link to="/blog">Voir tous les articles →</Link></div>
      </div>
      {error ? <ErrorState description={error} onRetry={load} /> : loading ? (
        <div className="blog-grid">{Array.from({ length: 3 }, (_, index) => <Skeleton className="blog-card-skeleton" key={index} />)}</div>
      ) : (
        <div className="blog-grid">{articles.map((article) => <BlogArticleCard article={article} key={article.id} />)}</div>
      )}
    </section>
  );
}
