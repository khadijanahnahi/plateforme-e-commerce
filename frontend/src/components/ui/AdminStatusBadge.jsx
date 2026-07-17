const statusLabels = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  DRAFT: "Brouillon",
  ARCHIVED: "Archivé",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
  EXPIRED: "Expiré",
};

export default function AdminStatusBadge({ status }) {
  if (!status) {
    return <span className="status-pill">-</span>;
  }

  return (
    <span className={`status-pill status-${String(status).toLowerCase()}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
