import { bannerPlacements } from "../../hooks/useAdminBanners";

function labelPlacement(placement) {
  if (placement === "HOME_HERO") return "Home hero";
  if (placement === "HOME_MIDDLE") return "Home middle";
  if (placement === "HOME_BOTTOM") return "Home bottom";
  return placement;
}

export default function BannerFormPanel({
  editingId,
  form,
  imageUploading,
  onCancelEdit,
  onFieldChange,
  onImageUpload,
  onSubmit,
}) {
  return (
    <form className="admin-panel admin-form" onSubmit={onSubmit}>
      <h2>{editingId ? "Update banner" : "Create banner"}</h2>
      <input name="title" value={form.title} onChange={onFieldChange} placeholder="Title" required />
      <textarea name="subtitle" value={form.subtitle} onChange={onFieldChange} placeholder="Subtitle" />
      <input name="imageUrl" value={form.imageUrl} onChange={onFieldChange} placeholder="Image URL" />

      <div className="banner-image-upload">
        <label>
          <span>Image locale</span>
          <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={onImageUpload} />
          <small>{imageUploading ? "Uploading..." : "PNG, JPG or WEBP accepted."}</small>
        </label>
        <div className="banner-form-preview">
          {form.imageUrl ? <img src={form.imageUrl} alt="Banner preview" /> : <span>No image selected</span>}
        </div>
      </div>
      <div className="admin-form-row">
        <input name="buttonText" value={form.buttonText} onChange={onFieldChange} placeholder="Button text" />
        <input name="targetUrl" value={form.targetUrl} onChange={onFieldChange} placeholder="/products or https://..." />
      </div>
      <div className="admin-form-row">
        <select name="placement" value={form.placement} onChange={onFieldChange}>
          {bannerPlacements.map((placement) => (
            <option key={placement} value={placement}>{labelPlacement(placement)}</option>
          ))}
        </select>
        <input name="priority" type="number" value={form.priority} onChange={onFieldChange} placeholder="Priority" />
      </div>
      <div className="admin-form-row">
        <input name="startsAt" type="datetime-local" value={form.startsAt} onChange={onFieldChange} />
        <input name="endsAt" type="datetime-local" value={form.endsAt} onChange={onFieldChange} />
      </div>
      <label className="check-row category-active-toggle">
        <input name="active" type="checkbox" checked={form.active} onChange={onFieldChange} />
        <span className="toggle-ui" aria-hidden="true" />
        <span>Active banner</span>
      </label>
      <div className="admin-form-actions">
        <button className="button button-primary" type="submit" disabled={imageUploading}>
          {editingId ? "Update banner" : "Create banner"}
        </button>
        {editingId ? (
          <button className="button button-secondary" type="button" onClick={onCancelEdit}>Cancel</button>
        ) : null}
      </div>
    </form>
  );
}
