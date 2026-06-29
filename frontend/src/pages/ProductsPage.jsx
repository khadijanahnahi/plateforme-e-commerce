import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import http from "../api/http";

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get("search") ?? "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(querySearch);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProducts(nextSearch = search, nextCategoryId = categoryId) {
    const response = await http.get("/products", {
      params: {
        search: nextSearch || undefined,
        categoryId: nextCategoryId || undefined,
      },
    });
    setProducts(response.data);
  }

  useEffect(() => {
    let mounted = true;
    setSearch(querySearch);
    setCategoryId("");

    async function loadInitialData() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          http.get("/products", {
            params: {
              search: querySearch || undefined,
            },
          }),
          http.get("/categories"),
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
  }, [querySearch]);

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

  async function addToCart(productId) {
    setMessage("");
    setError("");
    try {
      await http.post("/cart/items", { productId, quantity: 1 });
      window.dispatchEvent(new Event("shopsphere-cart-updated"));
      setMessage("Product added to cart.");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Login required or product unavailable.");
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
          <article className="product-card reveal-card" key={product.id}>
            <div className="product-image">
              <span className="favorite-chip">{product.status}</span>
              {product.imageUrl ? (
                <img className="catalog-image" src={product.imageUrl} alt={product.name} />
              ) : (
                <div className="product-placeholder"><span>{product.categoryName}</span></div>
              )}
            </div>
            <div className="product-copy">
              <h3>{product.name}</h3>
              <p>{product.description ?? "Premium ShopSphere item."}</p>
              <div className="price-row">
                <strong>{Number(product.price).toFixed(2)} DH</strong>
                <small>Stock: {product.stockQuantity}</small>
              </div>
              <div className="catalog-card-actions">
                <Link className="button button-secondary" to={`/products/${product.id}`}>View details</Link>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => addToCart(product.id)}
                  disabled={product.status !== "ACTIVE"}
                >
                  Add to cart
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
