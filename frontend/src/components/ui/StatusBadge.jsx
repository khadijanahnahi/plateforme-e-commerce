const labels = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  DRAFT: "Brouillon",
  OUT_OF_STOCK: "Rupture",
  ARCHIVED: "Archivé",
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  PAID: "Payé",
  UNPAID: "Non payé",
  FAILED: "Échec",
  APPROVED: "Approuvée",
  REJECTED: "Rejetée",
  EXPIRED: "Expirée",
  SCHEDULED: "Planifiée",
  NEW: "Nouveau",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  REQUESTED: "Demandée",
  UNDER_REVIEW: "En cours d’étude",
  RECEIVED: "Produit reçu",
  COMPLETED: "Finalisée",
};

const tones = {
  ACTIVE: "success",
  APPROVED: "success",
  PAID: "success",
  DELIVERED: "success",
  RESOLVED: "success",
  RECEIVED: "success",
  COMPLETED: "success",
  CONFIRMED: "info",
  SHIPPED: "info",
  IN_PROGRESS: "info",
  UNDER_REVIEW: "info",
  PENDING: "warning",
  SCHEDULED: "warning",
  NEW: "warning",
  REQUESTED: "warning",
  OUT_OF_STOCK: "danger",
  CANCELLED: "danger",
  FAILED: "danger",
  REJECTED: "danger",
  DRAFT: "neutral",
  INACTIVE: "neutral",
  ARCHIVED: "neutral",
  EXPIRED: "neutral",
};

export default function StatusBadge({ className = "", type = "status", value }) {
  if (!value) return <span className={`ui-status-badge ui-status-neutral ${className}`}>-</span>;
  const normalized = String(value).toUpperCase();
  return (
    <span className={`ui-status-badge ui-status-${tones[normalized] ?? "neutral"} ui-status-${type} ${className}`}>
      {labels[normalized] ?? normalized.replaceAll("_", " ")}
    </span>
  );
}
