const statusLabels = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  PAID: "Payé",
  UNPAID: "Non payé",
  FAILED: "Échec",
};

export default function OrderStatusBadge({ status, type = "status" }) {
  const safeStatus = status ?? "PENDING";

  return (
    <span className={`order-status-badge ${type}-${String(safeStatus).toLowerCase()}`}>
      {statusLabels[safeStatus] ?? safeStatus}
    </span>
  );
}
