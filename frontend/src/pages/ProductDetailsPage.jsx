import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";

const DIRECT_CHECKOUT_KEY = "shopsphere_direct_checkout";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const availableStock = product?.stockQuantity ?? 0;
  const canBuy = product?.status === "ACTIVE" && availableStock > 0;

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      try {
        const response = await http.get(`/products/${id}`);
        if (mounted) {
          setProduct(response.data);
          setQuantity(response.data.stockQuantity > 0 ? 1 : 0);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load product.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();
    return () => {
      mounted = false;
    };
  }, [id]);

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(availableStock, current + 1));
  }

  async function addToCart() {
    setMessage("");
    setError("");

    if (!canBuy) {
      setError("Product is not available.");
      return;
    }

    try {
      await http.post("/cart/items", {
        productId: product.id,
        quantity,
      });

      window.dispatchEvent(new Event("shopsphere-cart-updated"));
      setMessage("Product added to cart.");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Login required or product unavailable.");
    }
  }

  function buyNow() {
    setMessage("");
    setError("");

    if (!canBuy) {
      setError("Product is not available.");
      return;
    }

    sessionStorage.setItem(DIRECT_CHECKOUT_KEY, JSON.stringify({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      unitPrice: Number(product.price),
      quantity,
      subtotal: Number(product.price) * quantity,
      availableStock,
    }));
    navigate("/checkout?mode=direct");
  }

  if (loading) {
    return (
      <section className="page product-details-page">
        <div className="admin-panel">Loading product...</div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="page product-details-page">
        <div className="admin-alert">{error || "Product not found."}</div>
        <Link className="button button-secondary" to="/products">Back to products</Link>
      </section>
    );
  }

  return (
    <section className="page product-details-page">
      <Link className="details-back-link" to="/products">Back to products</Link>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="details-shell">
        <div className="details-gallery reveal-card">
          {product.imageUrl ? (
            <img className="details-image" src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="details-image details-placeholder">
              <span>{product.categoryName}</span>
            </div>
          )}
        </div>

        <article className="details-info reveal-card" style={{ "--delay": "0.12s" }}>
          <span className="section-kicker">{product.categoryName}</span>
          <h1>{product.name}</h1>

          <div className="details-rating">
            <strong>★★★★★</strong>
            <span>(4.8)</span>
            <span>128 Reviews</span>
          </div>

          <strong className="details-price">{Number(product.price).toFixed(2)} DH</strong>

          <div className="details-stock">
            {canBuy ? `In Stock (${availableStock})` : product.status === "OUT_OF_STOCK" ? "Out of stock" : "Unavailable"}
          </div>

          <p className="details-description">
            {product.description ?? "Premium ShopSphere product with a clean monochrome aesthetic."}
          </p>

          <div className="quantity-card">
            <span>Quantite</span>
            <div className="quantity-stepper">
              <button type="button" onClick={decreaseQuantity} disabled={!canBuy || quantity <= 1}>-</button>
              <strong>{quantity}</strong>
              <button type="button" onClick={increaseQuantity} disabled={!canBuy || quantity >= availableStock}>+</button>
            </div>
          </div>

          <div className="delivery-card">
            <strong>Livraison</strong>
            <p>Livraison sous 2 a 5 jours ouvrables.</p>
            <span>Paiement : Cash on Delivery</span>
          </div>

          <div className="details-actions">
            <button className="button button-primary" type="button" onClick={() => addToCart()} disabled={!canBuy}>
              Add to Cart
            </button>
            <button className="button button-primary" type="button" onClick={buyNow} disabled={!canBuy}>
              Buy Now
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
