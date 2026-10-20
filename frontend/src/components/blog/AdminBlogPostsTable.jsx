import { Link } from "react-router-dom";
import BlogStatusBadge from "./BlogStatusBadge";
import { EmptyState, Skeleton } from "../ui";

function date(value) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "Non publié";
}

export default function AdminBlogPostsTable({ loading, onAction, pending, posts }) {
  if (loading) return <div className="blog-table-skeleton">{Array.from({ length: 5 }, (_, index) => <Skeleton className="blog-row-skeleton" key={index} />)}</div>;
  if (!posts.length) return <EmptyState title="Aucun article" description="Créez votre premier brouillon éditorial." />;
  return (
    <div className="admin-table-scroll">
      <table className="admin-table blog-admin-table">
        <thead><tr><th>Couverture</th><th>Article</th><th>Catégorie</th><th>Auteur</th><th>Statut</th><th>Date</th><th>Vedette</th><th>Actions</th></tr></thead>
        <tbody>{posts.map((post) => (
          <tr key={post.id}>
            <td>{post.coverImageUrl ? <img className="blog-admin-thumb" src={post.coverImageUrl} alt="" /> : <span className="blog-admin-thumb is-empty">Sans image</span>}</td>
            <td><strong>{post.title}</strong><small>/{post.slug}</small></td>
            <td>{post.category?.name ?? "Sans catégorie"}</td>
            <td>{post.authorDisplayName}</td>
            <td><BlogStatusBadge status={post.status} /></td>
            <td>{date(post.publishedAt ?? post.updatedAt)}</td>
            <td>{post.featured ? "Oui" : "Non"}</td>
            <td><div className="blog-table-actions">
              <Link className="button button-secondary" to={`/admin/blog/posts/${post.id}/edit`}>Modifier</Link>
              {post.status !== "PUBLISHED" && post.status !== "ARCHIVED" ? <button disabled={pending} type="button" onClick={() => onAction(post, "publish")}>Publier</button> : null}
              {post.status === "PUBLISHED" ? <button disabled={pending} type="button" onClick={() => onAction(post, "feature")}>{post.featured ? "Retirer vedette" : "Mettre en vedette"}</button> : null}
              {post.status !== "ARCHIVED" ? <button disabled={pending} type="button" onClick={() => onAction(post, "archive")}>Archiver</button> : null}
              <button className="is-danger" disabled={pending} type="button" onClick={() => onAction(post, "delete")}>Supprimer</button>
            </div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
