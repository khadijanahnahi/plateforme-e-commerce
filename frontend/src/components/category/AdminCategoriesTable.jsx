import CategoryStatusBadge from "./CategoryStatusBadge";
import { AsyncState } from "../ui";

export default function AdminCategoriesTable({
  categories,
  loading,
  onEdit,
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
            <th>Name</th>
            <th>Description</th>
            <th>Products</th>
            <th>Status</th>
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
                  <span className="admin-product-thumb admin-product-thumb-empty">No image</span>
                )}
              </td>
              <td>{category.name}</td>
              <td>{category.description ?? "-"}</td>
              <td>{category.productCount ?? 0}</td>
              <td><CategoryStatusBadge active={category.active} /></td>
              <td className="table-actions">
                <button type="button" onClick={() => onEdit(category)}>Edit</button>
                <button type="button" onClick={() => onToggleStatus(category)}>
                  {category.active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </AsyncState>
  );
}
