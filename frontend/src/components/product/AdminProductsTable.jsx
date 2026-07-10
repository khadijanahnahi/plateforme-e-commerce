import { Button, EmptyState, Skeleton, StatusBadge } from "../ui";

function getStockBadge(product) {
  const stock = Number(product.stockQuantity);
  if (stock === 0) {
    return { label: "Rupture", className: "stock-out" };
  }
  if (stock <= 5) {
    return { label: "Stock faible", className: "stock-low" };
  }
  return { label: "En stock", className: "stock-in" };
}

export default function AdminProductsTable({
  loading,
  onArchive,
  onEdit,
  onStockChange,
  products,
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Nom produit</th>
            <th>Catégorie</th>
            <th>Prix</th>
            <th>Stock</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="ui-table-loading-row"><td colSpan="7"><Skeleton height="72px" width="100%" /></td></tr>
          ) : products.length === 0 ? (
            <tr><td colSpan="7"><EmptyState className="ui-table-empty-state" title="Aucun produit trouvé" description="Modifiez les filtres ou ajoutez un nouveau produit." /></td></tr>
          ) : products.map((product) => {
            const stockBadge = getStockBadge(product);

            return (
              <tr key={product.id}>
                <td>
                  {product.imageUrl ? (
                    <img className="admin-product-thumb" src={product.imageUrl} alt={product.name} />
                  ) : (
                    <span className="admin-product-thumb admin-product-thumb-empty">Sans image</span>
                  )}
                </td>
                <td>
                  <strong>{product.name}</strong>
                  <small className="admin-muted">SKU: {product.sku ?? "-"}</small>
                </td>
                <td>{product.categoryName}</td>
                <td>{Number(product.price).toFixed(2)} DH</td>
                <td>
                  <div className="stock-cell">
                    <strong>{product.stockQuantity}</strong>
                    <span className={`stock-badge ${stockBadge.className}`}>{stockBadge.label}</span>
                  </div>
                </td>
                <td><StatusBadge type="product" value={product.status} /></td>
                <td className="table-actions">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(product)}>Modifier</Button>
                  <Button size="sm" variant="outline" onClick={() => onStockChange(product)}>Stock</Button>
                  <Button size="sm" variant="danger" onClick={() => onArchive(product.id)}>Archiver</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
