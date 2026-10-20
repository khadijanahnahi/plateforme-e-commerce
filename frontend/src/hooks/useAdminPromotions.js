import { useEffect, useMemo, useState } from "react";
import { adminPromotionsApi, getApiErrorMessage } from "../api/adminPromotionsApi";

export const promotionStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"];
export const promotionTypes = ["FLASH_SALE", "SEASONAL", "CLEARANCE", "NEW_DROP", "MEMBER_DEAL"];

export const emptyPromotionForm = {
  productId: "",
  title: "",
  description: "",
  promotionType: "FLASH_SALE",
  originalPrice: "",
  promotionalPrice: "",
  startsAt: "",
  endsAt: "",
  status: "DRAFT",
  priority: "100",
  badgeLabel: "",
};

export function formatPromotionMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return `${Number(value).toFixed(2)} DH`;
}

export function formatPromotionDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function toPromotionInputDateTime(value) {
  if (!value) {
    return "";
  }
  return value.slice(0, 16);
}

export function toPromotionRequest(form) {
  return {
    productId: Number(form.productId),
    title: form.title.trim(),
    description: form.description.trim() || null,
    promotionType: form.promotionType,
    originalPrice: Number(form.originalPrice),
    promotionalPrice: Number(form.promotionalPrice),
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    status: form.status,
    priority: form.priority === "" ? 100 : Number(form.priority),
    badgeLabel: form.badgeLabel.trim() || null,
  };
}

export function validatePromotionForm(form) {
  if (!form.productId) {
    return "Product is required.";
  }
  if (!form.title.trim()) {
    return "Title is required.";
  }
  if (Number(form.promotionalPrice) <= 0) {
    return "Promotional price must be greater than 0.";
  }
  if (Number(form.originalPrice) <= Number(form.promotionalPrice)) {
    return "Original price must be greater than promotional price.";
  }
  if (!form.startsAt || !form.endsAt) {
    return "Start and end dates are required.";
  }
  if (new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
    return "End date must be after start date.";
  }
  return "";
}

function toPromotionParams(filters) {
  return {
    status: filters.status || undefined,
    type: filters.type || undefined,
    productId: filters.productId || undefined,
    activeOnly: filters.activeOnly || undefined,
  };
}

export function useAdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    productId: "",
    activeOnly: false,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "ACTIVE"),
    [products],
  );

  async function refreshPromotions(nextFilters = filters) {
    const response = await adminPromotionsApi.getPromotions(toPromotionParams(nextFilters));
    setPromotions(response.data);
    return response.data;
  }

  async function refreshProducts() {
    const response = await adminPromotionsApi.getProducts();
    setProducts(response.data);
    return response.data;
  }

  async function loadInitialData() {
    setLoading(true);
    try {
      const [promotionsResponse, productsResponse] = await Promise.all([
        adminPromotionsApi.getPromotions(),
        adminPromotionsApi.getProducts(),
      ]);
      setPromotions(promotionsResponse.data);
      setProducts(productsResponse.data);
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de charger les promotions."));
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(event) {
    const { name, value, type, checked } = event.target;
    setFilters((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function applyFilters(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await refreshPromotions();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de filtrer les promotions."));
    } finally {
      setLoading(false);
    }
  }

  async function resetFilters() {
    const nextFilters = { status: "", type: "", productId: "", activeOnly: false };
    setFilters(nextFilters);
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await refreshPromotions(nextFilters);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de réinitialiser les filtres de promotion."));
    } finally {
      setLoading(false);
    }
  }

  async function savePromotion(editingId, form) {
    setMessage("");
    setError("");

    const validationError = validatePromotionForm(form);
    if (validationError) {
      setError(validationError);
      return false;
    }

    try {
      if (editingId) {
        await adminPromotionsApi.updatePromotion(editingId, toPromotionRequest(form));
        setMessage("Promotion updated.");
      } else {
        await adminPromotionsApi.createPromotion(toPromotionRequest(form));
        setMessage("Promotion created.");
      }
      await Promise.all([refreshPromotions(), refreshProducts()]);
      return true;
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible d’enregistrer la promotion."));
      return false;
    }
  }

  async function activatePromotion(id) {
    setMessage("");
    setError("");
    try {
      await adminPromotionsApi.activatePromotion(id);
      setMessage("Promotion activated.");
      await refreshPromotions();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible d’activer la promotion."));
    }
  }

  async function deactivatePromotion(id) {
    setMessage("");
    setError("");
    try {
      await adminPromotionsApi.deactivatePromotion(id);
      setMessage("Promotion deactivated.");
      await refreshPromotions();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de désactiver la promotion."));
    }
  }

  async function expirePromotion(id) {
    setMessage("");
    setError("");
    try {
      await adminPromotionsApi.expirePromotion(id);
      setMessage("Promotion expired.");
      await refreshPromotions();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible d’expirer la promotion."));
    }
  }

  async function deletePromotion(id) {
    setMessage("");
    setError("");
    try {
      await adminPromotionsApi.deletePromotion(id);
      setMessage("Promotion deleted.");
      await refreshPromotions();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de supprimer la promotion."));
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  return {
    activeProducts,
    error,
    filters,
    loading,
    message,
    products,
    promotions,
    activatePromotion,
    applyFilters,
    deactivatePromotion,
    deletePromotion,
    expirePromotion,
    refreshPromotions,
    resetFilters,
    savePromotion,
    setError,
    setMessage,
    updateFilter,
  };
}
