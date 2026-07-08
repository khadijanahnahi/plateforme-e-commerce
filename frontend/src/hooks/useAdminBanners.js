import { useEffect, useMemo, useState } from "react";
import { adminBannersApi, getApiErrorMessage } from "../api/adminBannersApi";

export const bannerPlacements = ["HOME_HERO", "HOME_MIDDLE", "HOME_BOTTOM"];
export const bannerPlacementFilters = ["ALL", ...bannerPlacements];

export const emptyBannerForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  buttonText: "",
  targetUrl: "",
  placement: "HOME_HERO",
  priority: "100",
  startsAt: "",
  endsAt: "",
  active: true,
};

export function toBannerRequest(form) {
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    buttonText: form.buttonText.trim() || null,
    targetUrl: form.targetUrl.trim() || null,
    placement: form.placement,
    priority: form.priority === "" ? 100 : Number(form.priority),
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    active: form.active,
  };
}

export function toBannerInputDateTime(value) {
  return value ? value.slice(0, 16) : "";
}

export function useAdminBanners() {
  const [banners, setBanners] = useState([]);
  const [placementFilter, setPlacementFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredBanners = useMemo(() => {
    if (placementFilter === "ALL") {
      return banners;
    }
    return banners.filter((banner) => banner.placement === placementFilter);
  }, [banners, placementFilter]);

  async function refreshBanners() {
    const response = await adminBannersApi.getBanners();
    setBanners(response.data);
    return response.data;
  }

  async function loadBanners() {
    setLoading(true);
    try {
      await refreshBanners();
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to load banners."));
    } finally {
      setLoading(false);
    }
  }

  async function saveBanner(editingId, form) {
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await adminBannersApi.updateBanner(editingId, toBannerRequest(form));
        setMessage("Banner updated.");
      } else {
        await adminBannersApi.createBanner(toBannerRequest(form));
        setMessage("Banner created.");
      }
      await refreshBanners();
      return true;
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to save banner."));
      return false;
    }
  }

  async function changeBannerStatus(banner) {
    setMessage("");
    setError("");

    try {
      if (banner.active) {
        await adminBannersApi.deactivateBanner(banner.id);
        setMessage("Banner deactivated.");
      } else {
        await adminBannersApi.activateBanner(banner.id);
        setMessage("Banner activated.");
      }
      await refreshBanners();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to update banner status."));
    }
  }

  async function deleteBanner(id) {
    setMessage("");
    setError("");

    try {
      await adminBannersApi.deleteBanner(id);
      setMessage("Banner deleted.");
      await refreshBanners();
      return true;
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to delete banner."));
      return false;
    }
  }

  async function uploadBannerImage(file) {
    if (!file) {
      return "";
    }

    const formData = new FormData();
    formData.append("file", file);

    setImageUploading(true);
    setMessage("");
    setError("");

    try {
      const response = await adminBannersApi.uploadBannerImage(formData);
      setMessage("Banner image uploaded.");
      return response.data.imageUrl;
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to upload banner image."));
      return "";
    } finally {
      setImageUploading(false);
    }
  }

  useEffect(() => {
    loadBanners();
  }, []);

  return {
    banners,
    error,
    filteredBanners,
    imageUploading,
    loading,
    message,
    placementFilter,
    changeBannerStatus,
    deleteBanner,
    refreshBanners,
    saveBanner,
    setError,
    setMessage,
    setPlacementFilter,
    uploadBannerImage,
  };
}
