import { Link } from "react-router-dom";
import { allowedTransitions } from "../../hooks/useAdminOrders";
import AdminStatusBadge from "../ui/AdminStatusBadge";
import PaymentStatusBadge from "./PaymentStatusBadge";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function AdminOrdersTable({
  loading,
  onMarkAsPaid,
  onSelectedStatusChange,
  onUpdateStatus,
  orders,
  selectedStatuses,
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Update</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="8">Loading orders...</td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan="8">No orders found.</td></tr>
          ) : orders.map((order) => {
            const transitions = allowedTransitions[order.status] ?? [];
            const selectedStatus = selectedStatuses[order.id] ?? "";
            const canMarkAsPaid = order.paymentStatus === "UNPAID" && order.status !== "CANCELLED";

            return (
              <tr key={order.id}>
                <td>{order.orderNumber}</td>
                <td>
                  <strong>{order.customerName ?? "-"}</strong>
                  <small className="admin-muted">{order.customerPhone ?? order.customerEmail ?? "-"}</small>
                </td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{Number(order.totalAmount).toFixed(2)} DH</td>
                <td><AdminStatusBadge status={order.status} /></td>
                <td>
                  <div className="payment-cell">
                    <PaymentStatusBadge status={order.paymentStatus} />
                    {order.paymentStatus === "PAID" ? (
                      <span className="paid-note">Paid</span>
                    ) : (
                      <button
                        className="payment-action"
                        type="button"
                        disabled={!canMarkAsPaid}
                        onClick={() => onMarkAsPaid(order.id)}
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <div className="order-update-control">
                    <select
                      value={selectedStatus}
                      disabled={transitions.length === 0}
                      onChange={(event) => onSelectedStatusChange(order.id, event.target.value)}
                    >
                      <option value="">{transitions.length === 0 ? "No updates" : "Choose status"}</option>
                      {transitions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedStatus}
                      onClick={() => onUpdateStatus(order.id, selectedStatus)}
                    >
                      Apply
                    </button>
                  </div>
                </td>
                <td>
                  <Link className="table-link" to={`/admin/orders/${order.id}`}>Open</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
