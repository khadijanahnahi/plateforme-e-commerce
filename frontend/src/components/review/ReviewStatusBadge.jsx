export default function ReviewStatusBadge({ status }) {
  return (
    <span className={`status-pill review-${String(status).toLowerCase()}`}>
      {status}
    </span>
  );
}
