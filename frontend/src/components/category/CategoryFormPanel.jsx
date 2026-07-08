export default function CategoryFormPanel({
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
      <h2>{editingId ? "Update category" : "Create category"}</h2>
      <input name="name" value={form.name} onChange={onFieldChange} placeholder="Category name" required />
      <textarea name="description" value={form.description} onChange={onFieldChange} placeholder="Description" />
      <input name="imageUrl" value={form.imageUrl} onChange={onFieldChange} placeholder="Image URL" />

      <div className="category-image-upload">
        <label>
          <span>Image locale</span>
          <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={onImageUpload} />
          <small>{imageUploading ? "Uploading to Cloudinary..." : "PNG, JPG or WEBP accepted."}</small>
        </label>
        <div className="category-image-preview">
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="Category preview" />
          ) : (
            <span>No image selected</span>
          )}
        </div>
      </div>

      <label className="check-row category-active-toggle">
        <input name="active" type="checkbox" checked={form.active} onChange={onFieldChange} />
        <span className="toggle-ui" aria-hidden="true" />
        <span>Active category</span>
      </label>
      <div className="admin-form-actions">
        <button className="button button-primary" type="submit" disabled={imageUploading}>
          {editingId ? "Update category" : "Create category"}
        </button>
        {editingId ? (
          <button className="button button-secondary" type="button" onClick={onCancelEdit}>
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  );
}
