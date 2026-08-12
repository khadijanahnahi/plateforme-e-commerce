export function getActiveVariants(product) {
  return (product?.variants ?? []).filter((variant) => variant.active !== false);
}

export function requiresSizeSelection(product) {
  return getActiveVariants(product).some((variant) => variant.size !== "TAILLE_UNIQUE");
}

export function getAutomaticVariant(product) {
  const variants = getActiveVariants(product);
  return variants.length === 1 ? variants[0] : null;
}

export function getAddToCartKey(product) {
  const variant = getAutomaticVariant(product);
  return variant ? `add:${product.id ?? product.productId}:${variant.id}` : `add:${product.id ?? product.productId}`;
}
