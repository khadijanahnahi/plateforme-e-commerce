const paymentLabels = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  FAILED: "FAILED",
};

export default function PaymentStatusBadge({ status }) {
  const safeStatus = status ?? "UNPAID";

  return (
    <span className={`status-pill payment-${String(safeStatus).toLowerCase()}`}>
      {paymentLabels[safeStatus] ?? safeStatus}
    </span>
  );
}
