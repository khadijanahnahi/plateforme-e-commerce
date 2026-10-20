import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminBlogApi, blogError } from "../api/adminBlogApi";
import AdminPageHeader from "../components/layout/AdminPageHeader";
import AdminBlogPostsTable from "../components/blog/AdminBlogPostsTable";
import useAdminBlogPosts from "../hooks/useAdminBlogPosts";
import useFeedbackToast from "../hooks/useFeedbackToast";
import { ConfirmDialog, ErrorState, Input, Pagination, Select } from "../components/ui";

export default function AdminBlogPostsPage() {
  const navigate = useNavigate();
  const { error, filters, loading, page, posts, totalPages, load, setFilters } = useAdminBlogPosts();
  const [feedback, setFeedback] = useState({ message: "", error: "" });
  const [confirm, setConfirm] = useState(null);
  const [pending, setPending] = useState(false);
  useFeedbackToast(feedback.message, feedback.error);

  async function run(post, action) {
    if (["archive", "delete"].includes(action)) { setConfirm({ post, action }); return; }
    setPending(true);
    try {
      if (action === "publish") await adminBlogApi.publishPost(post.id);
      if (action === "feature") await adminBlogApi.featurePost(post.id, !post.featured);
      setFeedback({ message: "Article mis à jour.", error: "" });
      await load(page);
    } catch (exception) { setFeedback({ message: "", error: blogError(exception) }); }
    finally { setPending(false); }
  }

  async function confirmAction() {
    if (!confirm) return;
    setPending(true);
    try {
      if (confirm.action === "archive") await adminBlogApi.archivePost(confirm.post.id);
      else await adminBlogApi.deletePost(confirm.post.id);
      setConfirm(null);
      setFeedback({ message: confirm.action === "delete" ? "Article supprimé." : "Article archivé.", error: "" });
      await load(page);
    } catch (exception) { setFeedback({ message: "", error: blogError(exception) }); }
    finally { setPending(false); }
  }

  function submit(event) { event.preventDefault(); load(1); }

  return (
    <section className="page admin-page blog-admin-page">
      <AdminPageHeader kicker="Contenu éditorial" title="Articles" description="Créez, programmez et publiez les conseils ShopSphere." actionLabel="Nouvel article" onAction={() => navigate("/admin/blog/posts/new")} />
      <div className="admin-panel">
        <form className="blog-admin-filters" onSubmit={submit}>
          <Input aria-label="Rechercher" placeholder="Rechercher un titre ou un slug..." value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          <Select aria-label="Statut" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">Tous les statuts</option><option value="DRAFT">Brouillons</option><option value="SCHEDULED">Programmés</option><option value="PUBLISHED">Publiés</option><option value="ARCHIVED">Archivés</option>
          </Select>
          <button className="button button-primary" type="submit">Appliquer</button>
          <button className="button button-secondary" type="button" onClick={() => { const next = { search: "", status: "" }; setFilters(next); load(1, next); }}>Réinitialiser</button>
        </form>
        {error ? <ErrorState description={error} onRetry={() => load(page)} /> : <AdminBlogPostsTable loading={loading} pending={pending} posts={posts} onAction={run} />}
        <Pagination page={page} totalPages={totalPages} onPageChange={(next) => load(next)} />
      </div>
      <ConfirmDialog open={Boolean(confirm)} loading={pending} variant={confirm?.action === "delete" ? "danger" : "default"} title={confirm?.action === "delete" ? "Supprimer définitivement l’article ?" : "Archiver cet article ?"} description="Cette action retirera immédiatement l’article du blog public." confirmLabel={confirm?.action === "delete" ? "Supprimer" : "Archiver"} onClose={() => setConfirm(null)} onConfirm={confirmAction} />
    </section>
  );
}
