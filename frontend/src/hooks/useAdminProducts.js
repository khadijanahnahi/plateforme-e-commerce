import { useEffect, useMemo, useState } from "react";
import { adminProductsApi, getApiErrorMessage } from "../api/adminProductsApi";
import { adminPromotionsApi } from "../api/adminPromotionsApi";

export const productStatuses = ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"];
export const ADMIN_PRODUCTS_PAGE_SIZE = 10;
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function toProductRequest(form) {
  const variants = form.hasSizes
    ? form.variants.map((variant) => ({
        id: variant.id ?? null,
        size: variant.size,
        stockQuantity: Number(variant.stockQuantity),
        sku: variant.sku || null,
        active: true,
      }))
    : [];

  return {
    name: form.name,
    description: form.description || null,
    price: Number(form.price),
    stockQuantity: form.hasSizes
      ? variants.reduce((total, variant) => total + variant.stockQuantity, 0)
      : Number(form.stockQuantity),
    imageUrl: form.imageUrl || null,
    sku: form.sku || null,
    status: form.status,
    categoryId: Number(form.categoryId),
    audience: form.audience,
    variants,
  };
}

function toAutomaticPromotionRequest(productId, form, currentPromotion) {
  const startsAt = currentPromotion?.startsAt ?? new Date().toISOString().slice(0, 19);
  const endsAt = currentPromotion?.endsAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);

  return {
    productId,
    title: currentPromotion?.title ?? "Prix spécial",
    description: currentPromotion?.description ?? "Prix réduit sur ce produit.",
    promotionType: currentPromotion?.promotionType ?? "NEW_DROP",
    originalPrice: Number(form.originalPrice),
    promotionalPrice: Number(form.price),
    startsAt,
    endsAt,
    status: "ACTIVE",
    priority: currentPromotion?.priority ?? 100,
    badgeLabel: currentPromotion?.badgeLabel ?? "Promotion",
  };
}

async function synchronizeOriginalPrice(productId, form) {
  const response = await adminPromotionsApi.getPromotions({ productId, activeOnly: true });
  const currentPromotion = response.data[0];

  if (!form.hasOriginalPrice) {
    if (currentPromotion) {
      await adminPromotionsApi.deactivatePromotion(currentPromotion.id);
    }
    return;
  }

  const payload = toAutomaticPromotionRequest(productId, form, currentPromotion);

  if (currentPromotion) {
    await adminPromotionsApi.updatePromotion(currentPromotion.id, payload);
  } else {
    await adminPromotionsApi.createPromotion(payload);
  }
}

export function useAdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesStatus = statusFilter ? product.status === statusFilter : true;
    const matchesCategory = categoryFilter ? String(product.categoryId) === categoryFilter : true;
    return matchesStatus && matchesCategory;
  }), [categoryFilter, products, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ADMIN_PRODUCTS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * ADMIN_PRODUCTS_PAGE_SIZE,
    safeCurrentPage * ADMIN_PRODUCTS_PAGE_SIZE,
  );

  const productStats = useMemo(() => {
    const lowStockProducts = products.filter((product) => Number(product.stockQuantity) > 0 && Number(product.stockQuantity) <= 5);

    return {
      total: products.length,
      active: products.filter((product) => product.status === "ACTIVE").length,
      lowStock: lowStockProducts.length,
      outOfStock: products.filter((product) => Number(product.stockQuantity) === 0 || product.status === "OUT_OF_STOCK").length,
    };
  }, [products]);

  async function loadProducts(nextSearch = search) {
    const response = await adminProductsApi.getProducts(nextSearch);
    setProducts(response.data);
    return response.data;
  }

  async function loadInitialData() {
    setLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        adminProductsApi.getProducts(),
        adminProductsApi.getCategories(),
      ]);
      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data.filter((category) => category.active));
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de charger les produits."));
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts(event) {
    event.preventDefault();
    setLoading(true);
    setCurrentPage(1);
    try {
      await loadProducts(search);
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de rechercher les produits."));
    } finally {
      setLoading(false);
    }
  }

  async function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setCurrentPage(1);
    setLoading(true);
    try {
      await loadProducts("");
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de réinitialiser les filtres."));
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(editingId, form) {
    if (form.hasOriginalPrice && Number(form.originalPrice) <= Number(form.price)) {
      throw new Error("L’ancien prix doit être supérieur au prix actuel.");
    }

    let savedProduct;
    if (editingId) {
      const response = await adminProductsApi.updateProduct(editingId, toProductRequest(form));
      savedProduct = response.data;
      setMessage("Product updated.");
    } else {
      const response = await adminProductsApi.createProduct(toProductRequest(form));
      savedProduct = response.data;
      setMessage("Product created.");
    }
    await synchronizeOriginalPrice(savedProduct.id, form);
    await loadProducts();
  }

  async function archiveProduct(id) {
    await adminProductsApi.archiveProduct(id);
    setMessage("Product archived.");
    await loadProducts();
  }

  async function deleteProduct(id) {
    await adminProductsApi.deleteProduct(id);
    setMessage("Product deleted.");
    await loadProducts();
  }

  async function updateStock(product, stockQuantity) {
    await adminProductsApi.updateStock(product.id, stockQuantity);
    setMessage("Stock updated.");
    await loadProducts();
  }

  function updateStatusFilter(value) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function updateCategoryFilter(value) {
    setCategoryFilter(value);
    setCurrentPage(1);
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  return {
    categories,
    categoryFilter,
    currentPage: safeCurrentPage,
    error,
    filteredProducts,
    loading,
    message,
    paginatedProducts,
    productStats,
    products,
    search,
    statusFilter,
    totalPages,
    archiveProduct,
    deleteProduct,
    loadProducts,
    resetFilters,
    saveProduct,
    searchProducts,
    setCurrentPage,
    setError,
    setMessage,
    setSearch,
    updateCategoryFilter,
    updateStatusFilter,
    updateStock,
  };
}
