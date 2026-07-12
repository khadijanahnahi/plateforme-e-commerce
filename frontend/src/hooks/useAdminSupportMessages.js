import { useCallback, useEffect, useMemo, useState } from "react";
import { adminSupportMessagesApi, getAdminSupportError } from "../api/adminSupportMessagesApi";

export const supportMessageStatuses = ["NEW", "IN_PROGRESS", "RESOLVED", "ARCHIVED"];

export const emptySupportMessageFilters = {
  search: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};

export const supportMessageStatusLabels = {
  NEW: "Nouveau",
  IN_PROGRESS: "En cours",
  RESOLVED: "Resolue",
  ARCHIVED: "Archivee",
};

export function formatSupportMessageDate(value) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";
}

export function useAdminSupportMessages() {
  const [messages, setMessages] = useState([]);
  const [filters, setFilters] = useState(emptySupportMessageFilters);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const stats = useMemo(() => ({
    total: messages.length,
    new: messages.filter((item) => item.status === "NEW").length,
    inProgress: messages.filter((item) => item.status === "IN_PROGRESS").length,
    resolved: messages.filter((item) => item.status === "RESOLVED").length,
  }), [messages]);

  const loadMessages = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const response = await adminSupportMessagesApi.getMessages(nextFilters);
      setMessages(response.data);
    } catch (exception) {
      setError(getAdminSupportError(exception));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadMessages(emptySupportMessageFilters);
  }, []);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function applyFilters(event) {
    event?.preventDefault();
    await loadMessages(filters);
  }

  async function resetFilters() {
    setFilters(emptySupportMessageFilters);
    await loadMessages(emptySupportMessageFilters);
  }

  async function openMessage(id) {
    setDetailLoading(true);
    setError("");
    try {
      const response = await adminSupportMessagesApi.getMessageById(id);
      setSelectedMessage(response.data);
    } catch (exception) {
      setError(getAdminSupportError(exception, "Impossible de charger le message."));
    } finally {
      setDetailLoading(false);
    }
  }

  function closeMessage() {
    setSelectedMessage(null);
  }

  async function updateStatus(id, status) {
    setActionLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await adminSupportMessagesApi.updateStatus(id, status);
      setSelectedMessage((current) => (current?.id === id ? response.data : current));
      setMessage("Statut du message mis a jour.");
      await loadMessages(filters);
    } catch (exception) {
      setError(getAdminSupportError(exception, "Impossible de mettre a jour le statut."));
    } finally {
      setActionLoading(false);
    }
  }

  async function updateNote(id, adminNote) {
    setActionLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await adminSupportMessagesApi.updateNote(id, adminNote);
      setSelectedMessage((current) => (current?.id === id ? response.data : current));
      setMessage("Note interne enregistree.");
      await loadMessages(filters);
    } catch (exception) {
      setError(getAdminSupportError(exception, "Impossible d'enregistrer la note."));
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteMessage(id) {
    setActionLoading(true);
    setMessage("");
    setError("");
    try {
      await adminSupportMessagesApi.deleteMessage(id);
      setSelectedMessage(null);
      setMessage("Message supprime.");
      await loadMessages(filters);
    } catch (exception) {
      setError(getAdminSupportError(exception, "Impossible de supprimer le message."));
    } finally {
      setActionLoading(false);
    }
  }

  return {
    actionLoading,
    detailLoading,
    error,
    filters,
    loading,
    message,
    messages,
    selectedMessage,
    stats,
    applyFilters,
    closeMessage,
    deleteMessage,
    loadMessages,
    openMessage,
    resetFilters,
    updateFilter,
    updateNote,
    updateStatus,
  };
}
