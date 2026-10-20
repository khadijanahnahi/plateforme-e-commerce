import { AsyncState, Button } from "../ui";
import { formatReturnDate, returnReasonLabels } from "../../hooks/useAdminReturnRequests";
import ReturnRequestStatusBadge from "./ReturnRequestStatusBadge";

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

export default function AdminReturnRequestsTable({ loading, onOpen, requests }) {
  return (
    <AsyncState
      empty={requests.length === 0}
      emptyDescription="Les demandes envoyées depuis la politique de retour apparaîtront ici."
      emptyTitle="Aucune demande de retour"
      loading={loading}
      skeletonVariant="table"
    >
      <div className="admin-table-wrap">
        <table className="admin-table admin-return-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Commande</th>
              <th>Produit</th>
              <th>Motif</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.customerName}</strong>
                  <small className="admin-muted">{request.customerEmail}</small>
                </td>
                <td><strong>{request.orderNumber}</strong></td>
                <td>
                  <div className="admin-return-product">
                    <span>{request.productImageUrl ? <img src={request.productImageUrl} alt="" /> : "—"}</span>
                    <div><strong>{request.productName}</strong><small>Quantité : {request.quantity}</small></div>
                  </div>
                </td>
                <td>{returnReasonLabels[request.reason] ?? request.reason}</td>
                <td>{formatMoney(Number(request.unitPrice) * Number(request.quantity))}</td>
                <td>{formatReturnDate(request.createdAt)}</td>
                <td><ReturnRequestStatusBadge status={request.status} /></td>
                <td><Button size="sm" variant="outline" onClick={() => onOpen(request)}>Traiter</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AsyncState>
  );
}
