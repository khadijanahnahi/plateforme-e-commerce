import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { productApi } from "../api/productApi";
import ProductCard from "../components/product/ProductCard";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";

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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  async function loadProducts(nextSearch = search, nextCategoryId = categoryId) {
    const response = await productApi.getProducts({
      search: nextSearch || undefined,
      categoryId: nextCategoryId || undefined,
    });
    setProducts(response.data);
  }

  useEffect(() => {
    let mounted = true;
    setSearch(querySearch);
    setCategoryId(queryCategoryId);

    async function loadInitialData() {
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
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load products.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInitialData();
    return () => {
      mounted = false;
    };
  }, [querySearch, queryCategoryId]);

  async function handleFilter(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await loadProducts(search, categoryId);
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to filter products.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart(product) {
    setMessage("");
    setError("");
    try {
      await addToCart(product.id, 1);
      setMessage("Product added to cart.");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Login required or product unavailable.");
    }
  }

  async function handleToggleWishlist(product) {
    setMessage("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      const added = await toggleWishlist(product.id);
      setMessage(added ? "Produit ajoute a la wishlist." : "Produit retire de la wishlist.");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to update wishlist.");
    }
  }

  return (
    <section className="page catalog-page">
      <div className="catalog-hero">
        <div>
          <span className="section-kicker">ShopSphere catalog</span>
          <h1>Products</h1>
          <p>Explore monochrome essentials, filter by category and add available items to your cart.</p>
        </div>
      </div>

      <form className="catalog-filters" onSubmit={handleFilter}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product" />
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <button className="button button-primary" type="submit">Apply</button>
      </form>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="catalog-grid">
        {loading ? (
          <div className="admin-panel">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="admin-panel">No products found.</div>
        ) : products.map((product) => (
          <ProductCard
            isWishlisted={isWishlisted(product.id)}
            product={product}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            key={product.id}
          />
        ))}
      </div>
    </section>
  );
}
