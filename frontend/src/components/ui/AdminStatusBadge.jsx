export default function AdminStatusBadge({ status }) {
  if (!status) {
    return <span className="status-pill">-</span>;
  }

  return (
    <span className={`status-pill status-${String(status).toLowerCase()}`}>
      {status}
    </span>
  );
}
