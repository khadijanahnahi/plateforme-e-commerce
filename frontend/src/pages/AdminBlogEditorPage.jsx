import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminBlogApi, blogError } from "../api/adminBlogApi";
import BlogRichTextEditor from "../components/blog/BlogRichTextEditor";
import BlogStatusBadge from "../components/blog/BlogStatusBadge";
import { Button, Input, Select, Switch, Textarea } from "../components/ui";
import useFeedbackToast from "../hooks/useFeedbackToast";

const emptyDocument = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
const emptyForm = {
  title: "", slug: "", excerpt: "", contentJson: emptyDocument, contentHtml: "",
  coverImageKey: "", coverImageUrl: "", coverImageAlt: "", categoryId: "",
  tagIds: [], productIds: [], seoTitle: "", metaDescription: "",
};

export default function AdminBlogEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [feedback, setFeedback] = useState({ message: "", error: "" });
  useFeedbackToast(feedback.message, feedback.error);

  useEffect(() => {
    async function load() {
      try {
        const requests = [adminBlogApi.getCategories(), adminBlogApi.getTags(), adminBlogApi.getProducts()];
        if (editing) requests.push(adminBlogApi.getPost(id));
        const [categoryResponse, tagResponse, productResponse, postResponse] = await Promise.all(requests);
        setCategories(categoryResponse.data);
        setTags(tagResponse.data);
        setProducts(productResponse.data.filter((product) => product.status !== "ARCHIVED"));
        if (postResponse) {
          const value = postResponse.data;
          setPost(value);
          setForm({
            title: value.title ?? "", slug: value.slug ?? "", excerpt: value.excerpt ?? "",
            contentJson: value.contentJson || emptyDocument, contentHtml: value.contentHtml ?? "",
            coverImageKey: value.coverImageKey ?? "", coverImageUrl: value.coverImageUrl ?? "",
            coverImageAlt: value.coverImageAlt ?? "", categoryId: value.category?.id ?? "",
            tagIds: value.tags?.map((tag) => tag.id) ?? [], productIds: value.products?.map((product) => product.id) ?? [],
            seoTitle: value.seoTitle ?? "", metaDescription: value.metaDescription ?? "",
          });
        }
      } catch (exception) { setFeedback({ message: "", error: blogError(exception, "Impossible de charger l’éditeur.") }); }
      finally { setLoading(false); }
    }
    load();
  }, [editing, id]);

  useEffect(() => {
    function preventExit(event) { if (dirty) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", preventExit);
    return () => window.removeEventListener("beforeunload", preventExit);
  }, [dirty]);

  function field(name, value) { setForm((current) => ({ ...current, [name]: value })); setDirty(true); }
  function toggleArray(name, value) {
    setForm((current) => ({ ...current, [name]: current[name].includes(value) ? current[name].filter((item) => item !== value) : [...current[name], value] }));
    setDirty(true);
  }

  function payload() {
    return { ...form, slug: form.slug.trim() || null, categoryId: form.categoryId ? Number(form.categoryId) : null };
  }

  async function save() {
    if (!form.title.trim() || !form.excerpt.trim()) { setFeedback({ message: "", error: "Le titre et le résumé sont obligatoires." }); return null; }
    setSaving(true);
    try {
      const response = editing ? await adminBlogApi.updatePost(id, payload()) : await adminBlogApi.createPost(payload());
      setPost(response.data); setDirty(false); setFeedback({ message: "Brouillon enregistré.", error: "" });
      if (!editing) navigate(`/admin/blog/posts/${response.data.id}/edit`, { replace: true });
      return response.data;
    } catch (exception) { setFeedback({ message: "", error: blogError(exception, "Impossible d’enregistrer l’article.") }); return null; }
    finally { setSaving(false); }
  }

  async function action(type) {
    let current = await save();
    if (!current) return;
    setSaving(true);
    try {
      if (type === "publish") current = (await adminBlogApi.publishPost(current.id)).data;
      if (type === "archive") current = (await adminBlogApi.archivePost(current.id)).data;
      if (type === "feature") current = (await adminBlogApi.featurePost(current.id, !current.featured)).data;
      setPost(current); setFeedback({ message: "Publication mise à jour.", error: "" });
    } catch (exception) { setFeedback({ message: "", error: blogError(exception) }); }
    finally { setSaving(false); }
  }

  async function schedule() {
    const current = await save();
    if (!current || !scheduleAt) return;
    setSaving(true);
    try { setPost((await adminBlogApi.schedulePost(current.id, scheduleAt)).data); setScheduleOpen(false); setFeedback({ message: "Publication programmée.", error: "" }); }
    catch (exception) { setFeedback({ message: "", error: blogError(exception) }); }
    finally { setSaving(false); }
  }

  async function upload(scope, file) {
    setUploading(true);
    try { return (await adminBlogApi.uploadMedia(scope, file)).data; }
    catch (exception) { setFeedback({ message: "", error: blogError(exception, "Échec de l’envoi de l’image.") }); return null; }
    finally { setUploading(false); }
  }

  async function uploadCover(event) {
    const file = event.target.files?.[0]; if (!file) return;
    const media = await upload("cover", file);
    if (media) setForm((current) => ({ ...current, coverImageKey: media.key, coverImageUrl: media.url, coverImageAlt: current.coverImageAlt || form.title }));
    setDirty(true);
  }

  if (loading) return <section className="page admin-page"><div className="admin-panel">Chargement de l’éditeur...</div></section>;

  return (
    <section className="page admin-page blog-editor-page">
      <div className="blog-editor-heading">
        <div><Link to="/admin/blog/posts">← Articles</Link><span className="section-kicker">CMS ShopSphere</span><h1>{editing ? "Modifier l’article" : "Nouvel article"}</h1></div>
        <div className="blog-editor-heading-actions">{post ? <BlogStatusBadge status={post.status} /> : null}<span className={dirty ? "is-dirty" : ""}>{dirty ? "Modifications non enregistrées" : "À jour"}</span><Button loading={saving} variant="outline" onClick={save}>Enregistrer</Button><Button loading={saving} onClick={() => action("publish")}>Publier</Button></div>
      </div>

      <div className="blog-editor-layout">
        <main className="blog-editor-main">
          <div className="blog-editor-card">
            <Input fullWidth label="Titre" maxLength="220" value={form.title} onChange={(event) => field("title", event.target.value)} />
            <Textarea fullWidth label="Résumé" maxLength="600" rows="3" value={form.excerpt} onChange={(event) => field("excerpt", event.target.value)} />
            <div className="blog-editor-label-row"><strong>Contenu</strong><span>{form.contentHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length} mots</span></div>
            <BlogRichTextEditor initialJson={form.contentJson} uploading={uploading} onUploadImage={(file) => upload("content", file)} onChange={(content) => { setForm((current) => ({ ...current, contentJson: content.json, contentHtml: content.html })); setDirty(true); }} />
          </div>
        </main>

        <aside className="blog-editor-sidebar">
          <div className="blog-editor-card"><h2>Publication</h2>
            <Button fullWidth variant="outline" onClick={() => setPreview(true)}>Prévisualiser</Button>
            <Button fullWidth variant="outline" onClick={() => setScheduleOpen(true)}>Programmer</Button>
            {post?.status === "PUBLISHED" ? <Button fullWidth variant="outline" onClick={() => action("feature")}>{post.featured ? "Retirer de la une" : "Mettre à la une"}</Button> : null}
            {post && post.status !== "ARCHIVED" ? <Button fullWidth variant="danger" onClick={() => action("archive")}>Archiver</Button> : null}
          </div>
          <div className="blog-editor-card"><h2>Classement</h2>
            <Select fullWidth label="Catégorie" value={form.categoryId} onChange={(event) => field("categoryId", event.target.value)}><option value="">Sans catégorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select>
            <fieldset className="blog-check-list"><legend>Tags</legend>{tags.map((tag) => <label key={tag.id}><input type="checkbox" checked={form.tagIds.includes(tag.id)} onChange={() => toggleArray("tagIds", tag.id)} />{tag.name}</label>)}</fieldset>
          </div>
          <div className="blog-editor-card"><h2>Couverture</h2>
            {form.coverImageUrl ? <img className="blog-cover-preview" src={form.coverImageUrl} alt="Aperçu couverture" /> : null}
            <input accept="image/jpeg,image/png,image/webp" type="file" onChange={uploadCover} />
            <Input fullWidth label="Texte alternatif" value={form.coverImageAlt} onChange={(event) => field("coverImageAlt", event.target.value)} />
          </div>
          <div className="blog-editor-card"><h2>Produits associés</h2><div className="blog-product-checks">{products.map((product) => <label key={product.id}><input type="checkbox" checked={form.productIds.includes(product.id)} onChange={() => toggleArray("productIds", product.id)} /><span>{product.name}</span></label>)}</div></div>
          <div className="blog-editor-card"><h2>SEO</h2>
            <Input fullWidth label="Slug" helperText="Laissez vide pour une génération automatique." value={form.slug} onChange={(event) => field("slug", event.target.value)} />
            <Input fullWidth label="Titre SEO" maxLength="220" value={form.seoTitle} onChange={(event) => field("seoTitle", event.target.value)} />
            <Textarea fullWidth label="Méta-description" maxLength="320" rows="4" value={form.metaDescription} onChange={(event) => field("metaDescription", event.target.value)} />
          </div>
        </aside>
      </div>

      {preview ? <div className="blog-preview-overlay" onMouseDown={() => setPreview(false)}><article className="blog-preview-modal" onMouseDown={(event) => event.stopPropagation()}><button type="button" onClick={() => setPreview(false)}>Fermer</button><span className="section-kicker">Aperçu</span><h1>{form.title || "Sans titre"}</h1><p>{form.excerpt}</p>{form.coverImageUrl ? <img src={form.coverImageUrl} alt={form.coverImageAlt} /> : null}<div className="blog-article-content" dangerouslySetInnerHTML={{ __html: form.contentHtml }} /></article></div> : null}
      {scheduleOpen ? <div className="blog-preview-overlay" onMouseDown={() => setScheduleOpen(false)}><div className="blog-schedule-modal" onMouseDown={(event) => event.stopPropagation()}><h2>Programmer la publication</h2><Input fullWidth label="Date et heure" type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} /><div><Button variant="ghost" onClick={() => setScheduleOpen(false)}>Annuler</Button><Button loading={saving} onClick={schedule}>Programmer</Button></div></div></div> : null}
    </section>
  );
}
