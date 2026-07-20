import CategoryStatusBadge from "./CategoryStatusBadge";
import { AsyncState, Button } from "../ui";

export default function AdminCategoriesTable({
  categories,
  loading,
  onEdit,
  onRequestDeactivate,
  onToggleStatus,
}) {
  return (
    <AsyncState
      empty={categories.length === 0}
      emptyDescription="Créez une catégorie ou modifiez vos filtres."
      emptyTitle="Aucune catégorie trouvée"
      loading={loading}
      skeletonVariant="table"
    >
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Nom</th>
              <th>Description</th>
              <th>Produits</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  {category.imageUrl ? (
                    <img className="admin-product-thumb" src={category.imageUrl} alt={category.name} />
                  ) : (
                    <span className="admin-product-thumb admin-product-thumb-empty">Aucune image</span>
                  )}
                </td>
                <td>{category.name}</td>
                <td>{category.description ?? "-"}</td>
                <td>{category.productCount ?? 0}</td>
                <td><CategoryStatusBadge active={category.active} /></td>
                <td className="table-actions">
                  <Button size="sm" variant="outline" onClick={() => onEdit(category)}>
                    Modifier
                  </Button>
                  {category.active ? (
                    <Button size="sm" variant="ghost" onClick={() => onRequestDeactivate(category)}>
                      Désactiver
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => onToggleStatus(category)}>
                      Activer
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AsyncState>
  );
}
