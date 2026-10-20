import AdminPageHeader from "../components/layout/AdminPageHeader";
import AdminBlogTaxonomyManager from "../components/blog/AdminBlogTaxonomyManager";

export default function AdminBlogCategoriesPage() {
  return <section className="page admin-page blog-admin-page"><AdminPageHeader kicker="CMS ShopSphere" title="Catégories du blog" description="Structurez les articles par univers éditorial." /><AdminBlogTaxonomyManager type="categories" /></section>;
}
