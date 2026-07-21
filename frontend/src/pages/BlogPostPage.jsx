import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { blogApi } from "../api/blogApi";
import RelatedArticles from "../components/blog/RelatedArticles";
import RelatedProductsSection from "../components/blog/RelatedProductsSection";
import { ErrorState, Skeleton } from "../components/ui";
import useDocumentMeta from "../hooks/useDocumentMeta";

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value))
    : "";
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const canonical = `${window.location.origin}/blog/${slug}`;
  useDocumentMeta({
    canonical,
    title: article?.seoTitle || (article ? `${article.title} | ShopSphere` : "Journal ShopSphere"),
    description: article?.metaDescription || article?.excerpt,
    image: article?.coverImageUrl,
    jsonLd: article ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.metaDescription || article.excerpt,
      image: article.coverImageUrl || undefined,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: { "@type": "Person", name: article.authorDisplayName || "Équipe ShopSphere" },
      publisher: { "@type": "Organization", name: "ShopSphere" },
      mainEntityOfPage: canonical,
    } : null,
  });

  async function load() {
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const response = await blogApi.getPost(slug);
      const current = response.data;
      setArticle(current);
      if (current.category?.slug) {
        const relatedResponse = await blogApi.getPosts({
          category: current.category.slug,
          page: 0,
          size: 4,
          sort: "publishedAt",
        });
        setRelatedArticles((relatedResponse.data.content ?? []).filter((item) => item.id !== current.id).slice(0, 3));
      } else {
        setRelatedArticles([]);
      }
    } catch (exception) {
      if (exception.response?.status === 404) setNotFound(true);
      else setError("Impossible de charger cet article pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  async function share() {
    const payload = { title: article.title, text: article.excerpt, url: canonical };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        await navigator.clipboard.writeText(canonical);
        setShareMessage("Lien copié");
        window.setTimeout(() => setShareMessage(""), 2200);
      }
    } catch (exception) {
      if (exception.name !== "AbortError") setShareMessage("Partage indisponible");
    }
  }

  if (loading) {
    return <main className="page blog-post-page blog-post-loading"><Skeleton className="blog-post-cover-skeleton" /><Skeleton className="blog-post-copy-skeleton" /></main>;
  }

  if (notFound) {
    return <main className="page blog-post-page"><ErrorState title="Article introuvable" description="Cet article n’est pas publié ou n’existe plus." /><Link className="button button-primary" to="/blog">Retour au journal</Link></main>;
  }

  if (error) {
    return <main className="page blog-post-page"><ErrorState description={error} onRetry={load} /></main>;
  }

  return (
    <main className="blog-post-page">
      <article>
        <header className="page blog-post-header">
          <Link className="blog-back-link" to="/blog">← Retour au journal</Link>
          <div className="blog-post-heading">
            <span className="section-kicker">{article.category?.name ?? "Journal"}</span>
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            <div className="blog-post-byline">
              <span>Par {article.authorDisplayName || "Équipe ShopSphere"}</span>
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
              <span>{article.readingTimeMinutes} min de lecture</span>
              <button type="button" onClick={share}>Partager</button>
              {shareMessage ? <small role="status">{shareMessage}</small> : null}
            </div>
          </div>
        </header>

        {article.coverImageUrl ? (
          <figure className="page blog-post-cover">
            <img src={article.coverImageUrl} alt={article.coverImageAlt || article.title} />
          </figure>
        ) : null}

        <div className="page blog-post-body-layout">
          <aside className="blog-post-aside">
            <span>Publié dans</span>
            <strong>{article.category?.name ?? "Journal"}</strong>
            {article.tags?.length ? <div>{article.tags.map((tag) => <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>#{tag.name}</Link>)}</div> : null}
          </aside>
          <div className="blog-article-content" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
        </div>
      </article>

      <div className="page blog-related-shell">
        <RelatedProductsSection products={article.products} />
        <RelatedArticles articles={relatedArticles} />
      </div>
    </main>
  );
}
