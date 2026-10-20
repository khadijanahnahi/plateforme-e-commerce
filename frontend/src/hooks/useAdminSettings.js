import { useEffect, useState } from "react";
import { adminSettingsApi, getApiErrorMessage } from "../api/adminSettingsApi";

export const defaultStoreSettingsForm = {
  storeName: "",
  supportEmail: "",
  supportPhone: "",
  storeAddress: "",
  currency: "MAD",
  deliveryFee: "0",
  freeDeliveryThreshold: "0",
  estimatedDeliveryText: "",
  cashOnDeliveryEnabled: true,
  emailNotificationsEnabled: true,
  orderConfirmationEmailEnabled: true,
  orderStatusEmailEnabled: true,
  invoiceEmailEnabled: true,
  lowStockThreshold: "5",
  invoicePrefix: "INV",
  invoiceFooterNote: "",
};

function toForm(settings) {
  return {
    ...defaultStoreSettingsForm,
    ...settings,
    deliveryFee: String(settings.deliveryFee ?? 0),
    freeDeliveryThreshold: String(settings.freeDeliveryThreshold ?? 0),
    lowStockThreshold: String(settings.lowStockThreshold ?? 5),
  };
}

function toRequest(form) {
  return {
    storeName: form.storeName.trim(),
    supportEmail: form.supportEmail.trim(),
    supportPhone: form.supportPhone.trim() || null,
    storeAddress: form.storeAddress.trim() || null,
    currency: form.currency.trim().toUpperCase(),
    deliveryFee: Number(form.deliveryFee),
    freeDeliveryThreshold: Number(form.freeDeliveryThreshold),
    estimatedDeliveryText: form.estimatedDeliveryText.trim(),
    cashOnDeliveryEnabled: form.cashOnDeliveryEnabled,
    emailNotificationsEnabled: form.emailNotificationsEnabled,
    orderConfirmationEmailEnabled: form.orderConfirmationEmailEnabled,
    orderStatusEmailEnabled: form.orderStatusEmailEnabled,
    invoiceEmailEnabled: form.invoiceEmailEnabled,
    lowStockThreshold: Number(form.lowStockThreshold),
    invoicePrefix: form.invoicePrefix.trim().toUpperCase(),
    invoiceFooterNote: form.invoiceFooterNote.trim() || null,
  };
}

export function useAdminSettings() {
  const [form, setForm] = useState(defaultStoreSettingsForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  async function loadSettings() {
    setLoading(true);
    try {
      const response = await adminSettingsApi.getSettings();
      setForm(toForm(response.data));
      setUpdatedAt(response.data.updatedAt ?? null);
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de charger les paramètres de la boutique."));
    } finally {
      setLoading(false);
    }
  }

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setMessage("");
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await adminSettingsApi.updateSettings(toRequest(form));
      setForm(toForm(response.data));
      setUpdatedAt(response.data.updatedAt ?? new Date().toISOString());
      setMessage("Paramètres enregistrés avec succès.");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible d’enregistrer les paramètres."));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    error,
    form,
    loading,
    message,
    saving,
    updatedAt,
    loadSettings,
    saveSettings,
    updateField,
  };
}
