export default function CategoryStatusBadge({ active }) {
  return (
    <span className={`status-pill ${active ? "status-active" : "status-archived"}`}>
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}
