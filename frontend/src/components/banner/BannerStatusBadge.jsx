export default function BannerStatusBadge({ active }) {
  return (
    <span className={`status-pill ${active ? "status-active" : "status-archived"}`}>
      {active ? "Actif" : "Inactif"}
    </span>
  );
}
