export default function PromotionStatusBadge({ activeNow, status }) {
  return (
    <>
      <span className={`status-pill status-${String(status).toLowerCase()}`}>
        {status}
      </span>
      {activeNow ? <small className="promotion-live-dot">Live now</small> : null}
    </>
  );
}
