import { Link } from "react-router-dom";

export default function BlogFeaturedArticle({ article }) {
  if (!article) return null;
  return <article className="blog-featured">
    <div className="blog-featured-copy"><span className="section-kicker">Article à la une</span><h2>{article.title}</h2><p>{article.excerpt}</p><div><span>{article.category?.name ?? "Journal"}</span><span>{article.readingTimeMinutes} min</span></div><Link className="button button-primary" to={`/blog/${article.slug}`}>Découvrir l’article →</Link></div>
    <Link className="blog-featured-media" to={`/blog/${article.slug}`}>{article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.coverImageAlt || article.title} /> : <span>ShopSphere<br />Journal</span>}</Link>
  </article>;
}
