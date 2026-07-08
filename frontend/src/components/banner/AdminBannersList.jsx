import BannerStatusBadge from "./BannerStatusBadge";

export default function AdminBannersList({
  banners,
  loading,
  onDelete,
  onEdit,
  onToggleStatus,
}) {
  return (
    <div className="banner-admin-list">
      {loading ? (
        <div className="banner-admin-empty">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="banner-admin-empty">No banners found.</div>
      ) : banners.map((banner) => (
        <article className="banner-admin-card" key={banner.id}>
          <div className="banner-admin-thumb">
            {banner.imageUrl ? (
              <img src={banner.imageUrl} alt={banner.title} />
            ) : (
              <span>No image</span>
            )}
          </div>

          <div className="banner-admin-copy">
            <strong>{banner.title}</strong>
            <p>{banner.subtitle || "No subtitle"}</p>
          </div>

          <div className="banner-admin-meta">
            <span>{banner.placement}</span>
            <small>Priority {banner.priority}</small>
          </div>

          <BannerStatusBadge active={banner.active} />

          <div className="table-actions banner-admin-actions">
            <button type="button" onClick={() => onEdit(banner)}>Edit</button>
            <button type="button" onClick={() => onToggleStatus(banner)}>
              {banner.active ? "Deactivate" : "Activate"}
            </button>
            <button type="button" onClick={() => onDelete(banner)}>Delete</button>
          </div>
        </article>
      ))}
    </div>
  );
}
