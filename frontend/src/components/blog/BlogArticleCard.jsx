import { Link } from "react-router-dom";

function date(value) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value)) : ""; }

export default function BlogArticleCard({ article }) {
  return <article className="blog-article-card">
    <Link className="blog-card-media" to={`/blog/${article.slug}`}>
      {article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.coverImageAlt || article.title} loading="lazy" /> : <span>ShopSphere Journal</span>}
    </Link>
    <div className="blog-card-body">
      <div className="blog-card-meta"><span>{article.category?.name ?? "Journal"}</span><time>{date(article.publishedAt)}</time></div>
      <h2><Link to={`/blog/${article.slug}`}>{article.title}</Link></h2>
      <p>{article.excerpt}</p>
      <div className="blog-card-footer"><span>{article.readingTimeMinutes} min de lecture</span><Link to={`/blog/${article.slug}`}>Lire l’article <i aria-hidden="true">→</i></Link></div>
    </div>
  </article>;
}
