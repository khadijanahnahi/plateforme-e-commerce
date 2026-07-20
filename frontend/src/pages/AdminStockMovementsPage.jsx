import { AsyncState, Button, Input, Pagination, Select } from "../components/ui";
import {
  ADMIN_STOCK_MOVEMENTS_PAGE_SIZE,
  stockMovementTypes,
  useAdminStockMovements,
} from "../hooks/useAdminStockMovements";

const movementLabels = {
  ORDER_CREATED: "Commande créée",
  ORDER_CANCELLED: "Commande annulée",
  MANUAL_ADJUSTMENT: "Ajustement manuel",
  RESTOCK: "Réapprovisionnement",
  RETURN: "Retour produit",
  DAMAGED: "Produit endommagé",
};

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";
}

function MovementBadge({ type }) {
  const tone = type === "ORDER_CREATED" || type === "DAMAGED"
    ? "negative"
    : type === "ORDER_CANCELLED" || type === "RESTOCK" || type === "RETURN"
      ? "positive"
      : "neutral";
  return <span className={`stock-movement-badge stock-movement-${tone}`}>{movementLabels[type] ?? type}</span>;
}

export default function AdminStockMovementsPage() {
  const {
    currentPage,
    error,
    filters,
    loading,
    movements,
    paginatedMovements,
    products,
    totalPages,
    applyFilters,
    loadData,
    resetFilters,
    setCurrentPage,
    updateFilter,
  } = useAdminStockMovements();

  const firstShown = movements.length === 0
    ? 0
    : (currentPage - 1) * ADMIN_STOCK_MOVEMENTS_PAGE_SIZE + 1;
  const lastShown = Math.min(
    currentPage * ADMIN_STOCK_MOVEMENTS_PAGE_SIZE,
    movements.length,
  );

  return (
    <section className="page admin-page admin-stock-page">
      <form className="admin-panel stock-movement-filters" onSubmit={applyFilters}>
        <Select label="Produit" name="productId" value={filters.productId} onChange={updateFilter}>
          <option value="">Tous les produits</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </Select>
        <Select label="Type de mouvement" name="movementType" value={filters.movementType} onChange={updateFilter}>
          <option value="">Tous les types</option>
          {stockMovementTypes.map((type) => <option key={type} value={type}>{movementLabels[type]}</option>)}
        </Select>
        <Input label="Commande (ID)" min="1" name="orderId" type="number" value={filters.orderId} onChange={updateFilter} />
        <Input label="Date de début" name="dateFrom" type="date" value={filters.dateFrom} onChange={updateFilter} />
        <Input label="Date de fin" name="dateTo" type="date" value={filters.dateTo} onChange={updateFilter} />
        <div className="stock-filter-actions">
          <Button loading={loading} type="submit">Appliquer</Button>
          <Button disabled={loading} variant="outline" onClick={resetFilters}>Réinitialiser</Button>
        </div>
      </form>

      <div className="admin-panel stock-movement-panel">
        <div className="admin-list-summary">
          Affichage de {firstShown} à {lastShown} sur {movements.length} mouvement{movements.length === 1 ? "" : "s"}
        </div>
        <AsyncState
          empty={movements.length === 0}
          emptyDescription="Aucun changement de stock ne correspond aux filtres sélectionnés."
          emptyTitle="Aucun mouvement trouvé"
          error={error}
          loading={loading}
          onRetry={loadData}
          skeletonVariant="table"
        >
          <div className="admin-table-wrap">
            <table className="admin-table stock-movement-table">
              <thead>
                <tr>
                  <th>Date</th><th>Produit</th><th>Type</th><th>Avant</th><th>Variation</th><th>Après</th><th>Commande</th><th>Administrateur</th><th>Motif</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{formatDate(movement.createdAt)}</td>
                    <td><strong>{movement.productName}</strong><small className="admin-muted">ID {movement.productId}</small></td>
                    <td><MovementBadge type={movement.movementType} /></td>
                    <td>{movement.stockBefore}</td>
                    <td><strong className={movement.quantityChange > 0 ? "stock-change-positive" : "stock-change-negative"}>{movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange}</strong></td>
                    <td><strong>{movement.stockAfter}</strong></td>
                    <td>{movement.orderNumber ?? <span className="admin-muted">-</span>}</td>
                    <td>{movement.adminName ? <><strong>{movement.adminName}</strong><small className="admin-muted">{movement.adminEmail}</small></> : <span className="admin-muted">Système</span>}</td>
                    <td className="stock-reason-cell">{movement.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>

        {!loading && movements.length > ADMIN_STOCK_MOVEMENTS_PAGE_SIZE ? (
          <div className="pagination-bar">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
