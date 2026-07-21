import { useEffect, useState } from "react";
import { adminBlogApi, blogError } from "../../api/adminBlogApi";
import { Button, ConfirmDialog, EmptyState, ErrorState, Input, Skeleton, Textarea } from "../ui";
import useFeedbackToast from "../../hooks/useFeedbackToast";

export default function AdminBlogTaxonomyManager({ type }) {
  const categoryMode = type === "categories";
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(null);
  useFeedbackToast(message, error);

  async function load() {
    setLoading(true); setError("");
    try { setItems((await (categoryMode ? adminBlogApi.getCategories() : adminBlogApi.getTags())).data); }
    catch (exception) { setError(blogError(exception, "Impossible de charger les données.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [type]);

  async function submit(event) {
    event.preventDefault(); if (!form.name.trim()) return;
    setSaving(true); setError("");
    try {
      const payload = categoryMode ? form : { name: form.name };
      if (editing) await (categoryMode ? adminBlogApi.updateCategory(editing.id, payload) : adminBlogApi.updateTag(editing.id, payload));
      else await (categoryMode ? adminBlogApi.createCategory(payload) : adminBlogApi.createTag(payload));
      setMessage(editing ? "Élément modifié." : "Élément créé."); setEditing(null); setForm({ name: "", description: "" }); await load();
    } catch (exception) { setError(blogError(exception)); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!deleting) return; setSaving(true);
    try { await (categoryMode ? adminBlogApi.deleteCategory(deleting.id) : adminBlogApi.deleteTag(deleting.id)); setDeleting(null); setMessage("Élément supprimé."); await load(); }
    catch (exception) { setError(blogError(exception)); }
    finally { setSaving(false); }
  }

  return (
    <div className="blog-taxonomy-layout">
      <form className="admin-panel blog-taxonomy-form" onSubmit={submit}><h2>{editing ? "Modifier" : "Créer"}</h2>
        <Input fullWidth label="Nom" maxLength={categoryMode ? 100 : 80} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        {categoryMode ? <Textarea fullWidth label="Description" rows="5" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /> : null}
        <div className="blog-taxonomy-actions"><Button loading={saving} type="submit">{editing ? "Enregistrer" : "Créer"}</Button>{editing ? <Button variant="ghost" type="button" onClick={() => { setEditing(null); setForm({ name: "", description: "" }); }}>Annuler</Button> : null}</div>
      </form>
      <div className="admin-panel blog-taxonomy-list">
        {loading ? Array.from({ length: 4 }, (_, index) => <Skeleton className="blog-taxonomy-skeleton" key={index} />) : error && !items.length ? <ErrorState description={error} onRetry={load} /> : !items.length ? <EmptyState title={categoryMode ? "Aucune catégorie" : "Aucun tag"} description="Créez le premier élément éditorial." /> : items.map((item) => <article key={item.id}><div><strong>{item.name}</strong><span>/{item.slug}</span>{item.description ? <p>{item.description}</p> : null}</div><div><Button size="sm" variant="outline" onClick={() => { setEditing(item); setForm({ name: item.name, description: item.description ?? "" }); }}>Modifier</Button><Button size="sm" variant="danger" onClick={() => setDeleting(item)}>Supprimer</Button></div></article>)}
      </div>
      <ConfirmDialog open={Boolean(deleting)} loading={saving} variant="danger" title="Supprimer cet élément ?" description="La suppression est refusée lorsqu’il est encore utilisé par un article." confirmLabel="Supprimer" onClose={() => setDeleting(null)} onConfirm={remove} />
    </div>
  );
}
