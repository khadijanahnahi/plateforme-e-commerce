import AdminPageHeader from "../components/layout/AdminPageHeader";
import AdminBlogTaxonomyManager from "../components/blog/AdminBlogTaxonomyManager";

export default function AdminBlogTagsPage() {
  return <section className="page admin-page blog-admin-page"><AdminPageHeader kicker="CMS ShopSphere" title="Tags du blog" description="Ajoutez des mots-clés éditoriaux ciblés." /><AdminBlogTaxonomyManager type="tags" /></section>;
}
