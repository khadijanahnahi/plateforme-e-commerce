const labels = { DRAFT: "Brouillon", SCHEDULED: "Programmé", PUBLISHED: "Publié", ARCHIVED: "Archivé" };

export default function BlogStatusBadge({ status }) {
  return <span className={`blog-status-badge is-${String(status).toLowerCase()}`}>{labels[status] ?? status}</span>;
}
