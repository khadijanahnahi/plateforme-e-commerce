import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { productApi } from "../api/productApi";
import ProductCard from "../components/product/ProductCard";
import { AsyncState, Button } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";

const DIRECT_CHECKOUT_KEY = "shopsphere_direct_checkout";

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get("search") ?? "";
  const queryCategoryId = searchParams.get("categoryId") ?? "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(querySearch);
  const [categoryId, setCategoryId] = useState(queryCategoryId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();
  const { addToCart, isCartActionPending } = useCart();
  const { isWishlisted, isWishlistActionPending, toggleWishlist } = useWishlist();

  async function loadProducts(nextSearch = search, nextCategoryId = categoryId) {
    setLoading(true);
    setError("");
    try {
      const response = await productApi.getProducts({
        search: nextSearch || undefined,
        categoryId: nextCategoryId || undefined,
      });
      setProducts(response.data);
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Impossible de charger les produits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    setSearch(querySearch);
    setCategoryId(queryCategoryId);

    async function loadInitialData() {
      setLoading(true);
      setError("");
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          productApi.getProducts({
            search: querySearch || undefined,
            categoryId: queryCategoryId || undefined,
          }),
          productApi.getCategories(),
        ]);
        if (mounted) {
          setProducts(productsResponse.data);
          setCategories(categoriesResponse.data);
        }
      } catch (exception) {
        if (mounted) setError(exception.response?.data?.message ?? "Impossible de charger le catalogue.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitialData();
    return () => { mounted = false; };
  }, [querySearch, queryCategoryId]);

  async function handleFilter(event) {
    event.preventDefault();
    await loadProducts(search, categoryId);
  }

  async function handleAddToCart(product) {
    try {
      await addToCart(product.id, 1);
    } catch { /* Le contexte affiche une notification compréhensible. */ }
  }

  function handleBuyNow(product) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const stockQuantity = Number(product.stockQuantity ?? 0);
    if (product.status !== "ACTIVE" || stockQuantity <= 0) return;

    const displayPrice = Number(product.effectivePrice ?? product.promotionalPrice ?? product.price ?? 0);
    sessionStorage.setItem(DIRECT_CHECKOUT_KEY, JSON.stringify({
      productId: product.id,
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
      <div className="catalog-hero">
        <div>
          <span className="section-kicker">Catalogue ShopSphere</span>
          <h1>Produits</h1>
          <p>Explorez nos essentiels monochromes et filtrez-les par catégorie.</p>
        </div>
      </div>

      <form className="catalog-filters" onSubmit={handleFilter}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un produit" />
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <Button loading={loading} type="submit">Appliquer</Button>
      </form>

      <div className="catalog-grid">
        <AsyncState
          empty={products.length === 0}
          emptyDescription="Essayez une autre recherche ou consultez toutes les catégories."
          emptyTitle="Aucun produit trouvé"
          error={error}
          loading={loading}
          onRetry={() => loadProducts(search, categoryId)}
        >
          {products.map((product) => (
            <ProductCard
              addPending={isCartActionPending(`add:${product.id}`)}
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
    </section>
  );
}
