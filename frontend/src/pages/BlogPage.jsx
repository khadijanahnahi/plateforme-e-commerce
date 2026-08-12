import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { blogApi } from "../api/blogApi";
import BlogArticleCard from "../components/blog/BlogArticleCard";
import BlogCategoryFilter from "../components/blog/BlogCategoryFilter";
import BlogFeaturedArticle from "../components/blog/BlogFeaturedArticle";
import { EmptyState, ErrorState, Input, Pagination, Skeleton } from "../components/ui";
import useDocumentMeta from "../hooks/useDocumentMeta";

export default function BlogPage() {
  const [urlParams, setUrlParams] = useSearchParams();
  const [posts, setPosts] = useState([]); const [featured, setFeatured] = useState(null); const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(urlParams.get("search") ?? ""); const [category, setCategory] = useState(urlParams.get("category") ?? ""); const [tag] = useState(urlParams.get("tag") ?? ""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useDocumentMeta({ title: "Journal ShopSphere | Conseils et inspirations", description: "Conseils de style, inspirations monochromes et sélections ShopSphere.", canonical: `${window.location.origin}/blog` });

  async function load(nextPage = page, nextCategory = category, nextSearch = search) {
    setLoading(true); setError("");
    try {
      const [postResponse, featuredResponse, categoryResponse] = await Promise.all([
        blogApi.getPosts({ page: nextPage - 1, size: 9, search: nextSearch || undefined, category: nextCategory || undefined, tag: tag || undefined }), blogApi.getFeatured(1), blogApi.getCategories(),
      ]);
      setPosts(postResponse.data.content ?? []); setTotalPages(Math.max(1, postResponse.data.totalPages ?? 1)); setFeatured(featuredResponse.data?.[0] ?? null); setCategories(categoryResponse.data ?? []); setPage(nextPage);
    } catch { setError("Impossible de charger le journal pour le moment."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(1); }, []);
  function syncUrl(nextCategory, nextSearch) {
    const next = {};
    if (nextCategory) next.category = nextCategory;
    if (nextSearch) next.search = nextSearch;
    if (tag) next.tag = tag;
    setUrlParams(next, { replace: true });
  }
  function chooseCategory(value) { setCategory(value); syncUrl(value, search); load(1, value, search); }
  function submit(event) { event.preventDefault(); syncUrl(category, search); load(1); }

  return <main className="blog-page">
    <section className="page blog-hero">
      <div className="blog-hero-copy">
        <span className="section-kicker">Conseils & inspirations</span>
        <h1>Le journal <em>ShopSphere</em></h1>
        <p>Des idées concrètes pour composer un quotidien plus simple, élégant et durable.</p>
      </div>
      <div className="blog-hero-action">
        <span className="blog-hero-mark" aria-hidden="true">J</span>
        <div><strong>Éditorial ShopSphere</strong><small>Style, matières et inspirations</small></div>
        <Link className="button button-primary" to="/products">Explorer la boutique <span aria-hidden="true">→</span></Link>
      </div>
    </section>
    <div className="page blog-page-content">
      {!search && !category ? <BlogFeaturedArticle article={featured} /> : null}
      <form className="blog-toolbar" onSubmit={submit}><Input fullWidth aria-label="Rechercher un article" placeholder="Rechercher un article..." value={search} onChange={(event) => setSearch(event.target.value)} /><button className="button button-primary" type="submit">Rechercher</button></form>
      <BlogCategoryFilter categories={categories} selected={category} onChange={chooseCategory} />
      {!error && !loading && posts.length ? <header className="blog-results-heading">
        <div><span className="section-kicker">À lire maintenant</span><h2>{search || category ? "Résultats du journal" : "Dernières publications"}</h2></div>
        <span>{posts.length} article{posts.length > 1 ? "s" : ""} sur cette page</span>
      </header> : null}
      {error ? <ErrorState description={error} onRetry={() => load(page)} /> : loading ? <div className="blog-grid">{Array.from({ length: 6 }, (_, index) => <Skeleton className="blog-card-skeleton" key={index} />)}</div> : !posts.length ? <EmptyState title="Aucun article trouvé" description="Essayez un autre terme ou une autre catégorie." action={<button className="button button-secondary" type="button" onClick={() => { setSearch(""); chooseCategory(""); }}>Réinitialiser</button>} /> : <div className="blog-grid">{posts.map((article) => <BlogArticleCard article={article} key={article.id} />)}</div>}
      <Pagination page={page} totalPages={totalPages} onPageChange={(next) => load(next)} />
      <section className="blog-shop-cta"><div><span className="section-kicker">ShopSphere</span><h2>Du conseil à la sélection</h2><p>Retrouvez les pièces citées dans nos articles directement dans la boutique.</p></div><Link className="button button-primary" to="/products">Voir les produits →</Link></section>
    </div>
  </main>;
}
