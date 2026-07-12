const labels = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  DRAFT: "Brouillon",
  OUT_OF_STOCK: "Rupture",
  ARCHIVED: "Archive",
  PENDING: "En attente",
  CONFIRMED: "Confirmee",
  SHIPPED: "Expediee",
  DELIVERED: "Livree",
  CANCELLED: "Annulee",
  PAID: "Paye",
  UNPAID: "Non paye",
  FAILED: "Echec",
  APPROVED: "Approuve",
  REJECTED: "Rejete",
  EXPIRED: "Expire",
  SCHEDULED: "Planifiee",
  NEW: "Nouveau",
  IN_PROGRESS: "En cours",
  RESOLVED: "Resolu",
};

const tones = {
  ACTIVE: "success",
  APPROVED: "success",
  PAID: "success",
  DELIVERED: "success",
  RESOLVED: "success",
  CONFIRMED: "info",
  SHIPPED: "info",
  IN_PROGRESS: "info",
  PENDING: "warning",
  SCHEDULED: "warning",
  NEW: "warning",
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
