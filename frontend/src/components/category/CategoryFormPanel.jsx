import { Button, Input, Switch, Textarea } from "../ui";

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
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancelEdit}>
      <div
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="section-kicker">Formulaire catégorie</span>
            <h2 id="category-modal-title">{editingId ? "Modifier la catégorie" : "Ajouter une catégorie"}</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onCancelEdit}>Fermer</Button>
        </div>

        <form className="admin-form" onSubmit={onSubmit}>
          <Input
            fullWidth
            label="Nom de la catégorie"
            name="name"
            placeholder="Ex. Vêtements homme"
            required
            value={form.name}
            onChange={onFieldChange}
          />
          <Textarea
            fullWidth
            label="Description"
            name="description"
            placeholder="Description de la catégorie"
            value={form.description}
            onChange={onFieldChange}
          />

          <div className="category-image-upload">
            <label>
              <span>Image locale</span>
              <input
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                type="file"
                onChange={onImageUpload}
              />
              <small>{imageUploading ? "Importation en cours..." : "PNG, JPG ou WEBP acceptés."}</small>
            </label>
            <div className="category-image-preview">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Aperçu de la catégorie" />
              ) : (
                <span>Aucune image sélectionnée</span>
              )}
            </div>
          </div>

          <Input
            fullWidth
            label="URL de l'image"
            name="imageUrl"
            placeholder="https://..."
            value={form.imageUrl}
            onChange={onFieldChange}
          />

          <Switch
            checked={form.active}
            label="Catégorie active"
            name="active"
            onChange={onFieldChange}
          />

          <div className="admin-form-actions">
            <Button disabled={imageUploading} type="submit">
              {editingId ? "Enregistrer" : "Ajouter la catégorie"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
