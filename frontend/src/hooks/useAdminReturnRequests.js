import { useCallback, useEffect, useMemo, useState } from "react";
import { adminReturnRequestsApi, getAdminReturnError } from "../api/adminReturnRequestsApi";

export const returnStatuses = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "RECEIVED",
  "COMPLETED",
  "CANCELLED",
];

export const returnReasons = [
  "DAMAGED",
  "WRONG_PRODUCT",
  "NOT_AS_DESCRIBED",
  "SIZE_OR_FIT",
  "CHANGED_MIND",
  "OTHER",
];

export const returnStatusLabels = {
  REQUESTED: "Demandée",
  UNDER_REVIEW: "En cours d’étude",
  APPROVED: "Acceptée",
  REJECTED: "Refusée",
  RECEIVED: "Produit reçu",
  COMPLETED: "Finalisée",
  CANCELLED: "Annulée",
};

export const returnReasonLabels = {
  DAMAGED: "Produit endommagé",
  WRONG_PRODUCT: "Produit incorrect",
  NOT_AS_DESCRIBED: "Non conforme à la description",
  SIZE_OR_FIT: "Taille ou coupe",
  CHANGED_MIND: "Changement d’avis",
  OTHER: "Autre motif",
};

const initialFilters = { search: "", status: "", reason: "" };

export function formatReturnDate(value) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "-";
}

export function useAdminReturnRequests() {
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminReturnRequestsApi.getAll();
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (exception) {
      setError(getAdminReturnError(exception));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => ["REQUESTED", "UNDER_REVIEW"].includes(request.status)).length,
    approved: requests.filter((request) => ["APPROVED", "RECEIVED"].includes(request.status)).length,
    completed: requests.filter((request) => request.status === "COMPLETED").length,
  }), [requests]);

  const filteredRequests = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase("fr");
    return requests.filter((request) => {
      const matchesStatus = !filters.status || request.status === filters.status;
      const matchesReason = !filters.reason || request.reason === filters.reason;
      const haystack = [
        request.customerName,
        request.customerEmail,
        request.orderNumber,
        request.productName,
      ].filter(Boolean).join(" ").toLocaleLowerCase("fr");
      return matchesStatus && matchesReason && (!search || haystack.includes(search));
    });
  }, [filters, requests]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  async function updateStatus(id, status, adminNote) {
    if (actionLoading) return;
    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await adminReturnRequestsApi.updateStatus(id, status, adminNote);
      setRequests((current) => current.map((request) => (request.id === id ? response.data : request)));
      setSelectedRequest(response.data);
      setMessage("La demande de retour a été mise à jour.");
    } catch (exception) {
      setError(getAdminReturnError(exception, "Impossible de mettre à jour cette demande."));
    } finally {
      setActionLoading(false);
    }
  }

  return {
    actionLoading,
    error,
    filteredRequests,
    filters,
    loading,
    message,
    requests,
    selectedRequest,
    stats,
    closeRequest: () => setSelectedRequest(null),
    loadRequests,
    openRequest: setSelectedRequest,
    resetFilters,
    updateFilter,
    updateStatus,
  };
}
