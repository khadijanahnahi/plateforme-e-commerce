import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { productApi } from "../api/productApi";
import ProductCard from "../components/product/ProductCard";
import { AsyncState, Button, Pagination, Select } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { getAddToCartKey, getAutomaticVariant, requiresSizeSelection } from "../utils/productVariants";

const DIRECT_CHECKOUT_KEY = "shopsphere_direct_checkout";
const CATALOG_PAGE_SIZE = 24;

function parsePage(value) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get("search") ?? "";
  const queryCategoryId = searchParams.get("categoryId") ?? "";
  const queryAudience = searchParams.get("audience") ?? "";
  const queryProductSize = searchParams.get("productSize") ?? "";
  const queryPage = parsePage(searchParams.get("page"));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: queryPage, totalElements: 0, totalPages: 1 });
  const [search, setSearch] = useState(querySearch);
  const [categoryId, setCategoryId] = useState(queryCategoryId);
  const [audience, setAudience] = useState(queryAudience);
  const [productSize, setProductSize] = useState(queryProductSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();
  const { addToCart, isCartActionPending } = useCart();
  const { isWishlisted, isWishlistActionPending, toggleWishlist } = useWishlist();

  function applyPageData(data) {
    const content = Array.isArray(data) ? data : data.content ?? [];
    setProducts(content);
    setPagination({
      page: Array.isArray(data) ? 1 : (data.number ?? 0) + 1,
      totalElements: Array.isArray(data) ? data.length : data.totalElements ?? 0,
      totalPages: Math.max(1, Array.isArray(data) ? 1 : data.totalPages ?? 1),
    });
  }

  async function loadProducts(
    nextSearch = querySearch,
    nextCategoryId = queryCategoryId,
    nextAudience = queryAudience,
    nextProductSize = queryProductSize,
    nextPage = queryPage,
  ) {
    setLoading(true);
    setError("");
    try {
      const response = await productApi.getProducts({
        search: nextSearch || undefined,
        categoryId: nextCategoryId || undefined,
        audience: nextAudience || undefined,
        productSize: nextProductSize || undefined,
        page: Math.max(0, nextPage - 1),
        size: CATALOG_PAGE_SIZE,
      });
      applyPageData(response.data);
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Impossible de charger les produits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const response = await productApi.getCategories();
        if (mounted) setCategories(response.data);
      } catch (exception) {
        if (mounted) setError(exception.response?.data?.message ?? "Impossible de charger les catégories.");
      }
    }

    loadCategories();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setSearch(querySearch);
    setCategoryId(queryCategoryId);
    setAudience(queryAudience);
    setProductSize(queryProductSize);
    setLoading(true);
    setError("");

    productApi.getProducts({
      search: querySearch || undefined,
      categoryId: queryCategoryId || undefined,
      audience: queryAudience || undefined,
      productSize: queryProductSize || undefined,
      page: queryPage - 1,
      size: CATALOG_PAGE_SIZE,
    }).then((response) => {
      if (mounted) applyPageData(response.data);
    }).catch((exception) => {
      if (mounted) setError(exception.response?.data?.message ?? "Impossible de charger le catalogue.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [querySearch, queryCategoryId, queryAudience, queryProductSize, queryPage]);

  async function handleFilter(event) {
    event.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (search.trim()) nextParams.set("search", search.trim());
    else nextParams.delete("search");
    if (categoryId) nextParams.set("categoryId", categoryId);
    else nextParams.delete("categoryId");
    if (audience) nextParams.set("audience", audience);
    else nextParams.delete("audience");
    if (productSize) nextParams.set("productSize", productSize);
    else nextParams.delete("productSize");
    nextParams.delete("page");
    setSearchParams(nextParams);
  }

  function handlePageChange(nextPage) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    else nextParams.delete("page");
    setSearchParams(nextParams);
    document.querySelector(".catalog-filters")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleAddToCart(product) {
    if (requiresSizeSelection(product)) {
      navigate(`/products/${product.id}`);
      return;
    }
    try {
      await addToCart(product.id, 1, getAutomaticVariant(product)?.id ?? null);
    } catch { /* Le contexte affiche une notification compréhensible. */ }
  }

  function handleBuyNow(product) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const stockQuantity = Number(product.stockQuantity ?? 0);
    if (product.status !== "ACTIVE" || stockQuantity <= 0) return;
    if (requiresSizeSelection(product)) {
      navigate(`/products/${product.id}`);
      return;
    }

    const displayPrice = Number(product.effectivePrice ?? product.promotionalPrice ?? product.price ?? 0);
    const variant = getAutomaticVariant(product);
    sessionStorage.setItem(DIRECT_CHECKOUT_KEY, JSON.stringify({
      productId: product.id,
      variantId: variant?.id ?? null,
      size: variant?.size ?? null,
      variantSku: variant?.sku ?? null,
      productName: product.name,
      imageUrl: product.imageUrl,
      unitPrice: displayPrice,
      quantity: 1,
      subtotal: displayPrice,
      availableStock: stockQuantity,
    }));
    navigate("/checkout?mode=direct");
  }

  async function handleToggleWishlist(product) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      await toggleWishlist(product.id);
    } catch { /* Le contexte affiche une notification compréhensible. */ }
  }

  return (
    <section className="page catalog-page">
      {/*
      <div className="catalog-hero">
        <div>
          <span className="section-kicker">Catalogue ShopSphere</span>
          <h1>Produits</h1>
          <p>Explorez nos essentiels monochromes et filtrez-les par catégorie.</p>
        </div>
      </div>
      */}

      <form className="catalog-filters" onSubmit={handleFilter}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un produit" />
        <Select aria-label="Catégorie" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </Select>
        <Select value={audience} onChange={(event) => setAudience(event.target.value)} aria-label="Genre">
          <option value="">Tous les genres</option>
          <option value="UNISEXE">Unisexe</option>
          <option value="HOMME">Homme</option>
          <option value="FEMME">Femme</option>
        </Select>
        <Select value={productSize} onChange={(event) => setProductSize(event.target.value)} aria-label="Taille">
          <option value="">Toutes les tailles</option>
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
            <option value={size} key={size}>{size}</option>
          ))}
        </Select>
        <Button loading={loading} type="submit">Appliquer</Button>
      </form>

      <div className="catalog-grid">
        <AsyncState
          empty={products.length === 0}
          emptyDescription="Essayez une autre recherche ou consultez toutes les catégories."
          emptyTitle="Aucun produit trouvé"
          error={error}
          loading={loading}
          onRetry={() => loadProducts(querySearch, queryCategoryId, queryAudience, queryProductSize, queryPage)}
        >
          {products.map((product) => (
            <ProductCard
              addPending={isCartActionPending(getAddToCartKey(product))}
              isWishlisted={isWishlisted(product.id)}
              product={product}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onToggleWishlist={handleToggleWishlist}
              wishlistPending={isWishlistActionPending(product.id)}
              key={product.id}
            />
          ))}
        </AsyncState>
      </div>

      {pagination.totalElements > 0 ? (
        <div className="catalog-pagination-bar">
          <p>
            Affichage {(pagination.page - 1) * CATALOG_PAGE_SIZE + 1}–{Math.min(
              pagination.page * CATALOG_PAGE_SIZE,
              pagination.totalElements,
            )} sur {pagination.totalElements} produits
          </p>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </section>
  );
}
