import { Link } from "react-router-dom";

function money(value) { return `${Number(value ?? 0).toFixed(2)} DH`; }
export default function RelatedProductsSection({ products }) {
  if (!products?.length) return null;
  return <section className="blog-related-products"><div className="blog-section-heading"><span className="section-kicker">Sélection associée</span><h2>Découvrir les produits</h2></div><div className="blog-product-grid">{products.map((product) => {
    const price = product.effectivePrice ?? product.promotionalPrice ?? product.price;
    const hasPromotion = product.promotionActive && Number(product.originalPrice) > Number(price);
    return <article key={product.id}><Link to={`/products/${product.id}`}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" /> : <span>ShopSphere</span>}</Link><small>{product.categoryName}</small><h3>{product.name}</h3><div><strong>{money(price)}</strong>{hasPromotion ? <del>{money(product.originalPrice)}</del> : null}</div><Link className="button button-secondary" to={`/products/${product.id}`}>Voir le produit</Link></article>;
  })}</div></section>;
}
