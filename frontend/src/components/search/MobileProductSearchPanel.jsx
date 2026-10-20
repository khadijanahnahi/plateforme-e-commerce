import { useEffect } from "react";
import { createPortal } from "react-dom";
import ProductSearchAutocomplete from "./ProductSearchAutocomplete";

export default function MobileProductSearchPanel({ onClose, onValueChange, open, value }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div aria-label="Recherche de produits" aria-modal="true" className="mobile-product-search-panel" role="dialog">
      <div className="mobile-product-search-header">
        <strong>Rechercher</strong>
        <button aria-label="Fermer la recherche" onClick={onClose} type="button">×</button>
      </div>
      <ProductSearchAutocomplete
        autoFocus
        onNavigate={onClose}
        onValueChange={onValueChange}
        placeholder="Rechercher un produit..."
        value={value}
        variant="mobile"
      />
    </div>,
    document.body,
  );
}
