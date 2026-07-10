import { useState } from "react";
import AdminBannersList from "../components/banner/AdminBannersList";
import BannerFormPanel from "../components/banner/BannerFormPanel";
import AdminPageHeader from "../components/layout/AdminPageHeader";
import {
  bannerPlacementFilters,
  emptyBannerForm,
  toBannerInputDateTime,
  useAdminBanners,
} from "../hooks/useAdminBanners";
import useFeedbackToast from "../hooks/useFeedbackToast";

function labelPlacementFilter(placement) {
  if (placement === "ALL") return "Placement: All";
  if (placement === "HOME_HERO") return "Home hero";
  if (placement === "HOME_MIDDLE") return "Home middle";
  if (placement === "HOME_BOTTOM") return "Home bottom";
  return placement;
}

export default function AdminBannersPage() {
  const {
    error,
    filteredBanners,
    imageUploading,
    loading,
    message,
    placementFilter,
    changeBannerStatus,
    deleteBanner,
    saveBanner,
    setPlacementFilter,
    uploadBannerImage,
  } = useAdminBanners();
  useFeedbackToast(message, error);

  const [form, setForm] = useState(emptyBannerForm);
  const [editingId, setEditingId] = useState(null);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function editBanner(banner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl ?? "",
      buttonText: banner.buttonText ?? "",
      targetUrl: banner.targetUrl ?? "",
      placement: banner.placement ?? "HOME_HERO",
      priority: banner.priority ?? "100",
      startsAt: toBannerInputDateTime(banner.startsAt),
      endsAt: toBannerInputDateTime(banner.endsAt),
      active: Boolean(banner.active),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyBannerForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const saved = await saveBanner(editingId, form);
    if (saved) {
      resetForm();
    }
  }

  async function handleDeleteBanner(banner) {
    const deleted = await deleteBanner(banner.id);
    if (deleted && editingId === banner.id) {
      resetForm();
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    const imageUrl = await uploadBannerImage(file);
    if (imageUrl) {
      setForm((current) => ({ ...current, imageUrl }));
    }
    event.target.value = "";
  }

  return (
    <section className="page admin-page">
      <AdminPageHeader
        kicker="Admin marketing"
        title="Banners"
        description="Manage internal homepage campaigns and promotional placements."
      />

      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-banners-layout">
        <BannerFormPanel
          editingId={editingId}
          form={form}
          imageUploading={imageUploading}
          onCancelEdit={resetForm}
          onFieldChange={updateField}
          onImageUpload={handleImageUpload}
          onSubmit={handleSubmit}
        />

        <div className="admin-panel admin-banners-list-panel">
          <div className="admin-search">
            <select value={placementFilter} onChange={(event) => setPlacementFilter(event.target.value)}>
              {bannerPlacementFilters.map((placement) => (
                <option key={placement} value={placement}>
                  {labelPlacementFilter(placement)}
                </option>
              ))}
            </select>
          </div>
          <AdminBannersList
            banners={filteredBanners}
            loading={loading}
            onDelete={handleDeleteBanner}
            onEdit={editBanner}
            onToggleStatus={changeBannerStatus}
          />
        </div>
      </div>
    </section>
  );
}
