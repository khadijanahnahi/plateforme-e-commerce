import AdminStatusBadge from "../ui/AdminStatusBadge";

function getStockBadge(product) {
  const stock = Number(product.stockQuantity);
  if (stock === 0) {
    return { label: "Out of stock", className: "stock-out" };
  }
  if (stock <= 5) {
    return { label: "Low stock", className: "stock-low" };
  }
  return { label: "In stock", className: "stock-in" };
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
            <th>Categorie</th>
            <th>Prix</th>
            <th>Stock</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7">Loading products...</td></tr>
          ) : products.length === 0 ? (
            <tr><td colSpan="7">No products found.</td></tr>
          ) : products.map((product) => {
            const stockBadge = getStockBadge(product);

            return (
              <tr key={product.id}>
                <td>
                  {product.imageUrl ? (
                    <img className="admin-product-thumb" src={product.imageUrl} alt={product.name} />
                  ) : (
                    <span className="admin-product-thumb admin-product-thumb-empty">No image</span>
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
                <td><AdminStatusBadge status={product.status} /></td>
                <td className="table-actions">
                  <button type="button" onClick={() => onEdit(product)}>Modifier</button>
                  <button type="button" onClick={() => onStockChange(product)}>Stock</button>
                  <button type="button" onClick={() => onArchive(product.id)}>Archiver</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
