import BlogArticleCard from "./BlogArticleCard";
export default function RelatedArticles({ articles }) {
  if (!articles?.length) return null;
  return <section className="blog-related"><div className="blog-section-heading"><span className="section-kicker">À lire ensuite</span><h2>Articles similaires</h2></div><div className="blog-grid">{articles.map((article) => <BlogArticleCard article={article} key={article.id} />)}</div></section>;
}
