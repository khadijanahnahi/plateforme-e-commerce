import { Link } from "react-router-dom";
import { allowedTransitions } from "../../hooks/useAdminOrders";
import AdminStatusBadge from "../ui/AdminStatusBadge";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { AsyncState, Button, Select } from "../ui";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function AdminOrdersTable({
  loading,
  isActionPending,
  onMarkAsPaid,
  onSelectedStatusChange,
  onUpdateStatus,
  orders,
  selectedStatuses,
}) {
  return (
    <AsyncState
      empty={orders.length === 0}
      emptyDescription="Les commandes correspondant à vos filtres apparaîtront ici."
      emptyTitle="Aucune commande trouvée"
      loading={loading}
      skeletonVariant="table"
    >
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
          {orders.map((order) => {
            const transitions = allowedTransitions[order.status] ?? [];
            const selectedStatus = selectedStatuses[order.id] ?? "";
            const canMarkAsPaid = order.paymentStatus === "UNPAID" && order.status !== "CANCELLED";
            const paymentPending = isActionPending?.(`payment:${order.id}`) ?? false;
            const statusPending = isActionPending?.(`status:${order.id}`) ?? false;

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
                      <Button
                        className="payment-action"
                        loading={paymentPending}
                        size="sm"
                        disabled={!canMarkAsPaid}
                        onClick={() => onMarkAsPaid(order.id)}
                      >
                        Marquer payé
                      </Button>
                    )}
                  </div>
                </td>
                <td>
                  <div className="order-update-control">
                    <Select
                      value={selectedStatus}
                      disabled={transitions.length === 0 || statusPending}
                      onChange={(event) => onSelectedStatusChange(order.id, event.target.value)}
                    >
                      <option value="">{transitions.length === 0 ? "No updates" : "Choose status"}</option>
                      {transitions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </Select>
                    <Button
                      loading={statusPending}
                      size="sm"
                      disabled={!selectedStatus}
                      onClick={() => onUpdateStatus(order.id, selectedStatus)}
                    >
                      Appliquer
                    </Button>
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
    </AsyncState>
  );
}
