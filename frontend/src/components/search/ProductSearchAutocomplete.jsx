import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useProductSearchSuggestions from "../../hooks/useProductSearchSuggestions";
import Skeleton from "../ui/Skeleton";
import ProductSearchSuggestionItem from "./ProductSearchSuggestionItem";

export default function ProductSearchAutocomplete({
  autoFocus = false,
  className = "",
  maxResults = 6,
  onNavigate,
  onValueChange,
  placeholder = "Rechercher un produit...",
  value = "",
  variant = "header",
}) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = `product-search-${useId().replaceAll(":", "")}`;
  const normalizedQuery = value.trim();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const {
    error,
    isDebouncing,
    isFetching,
    refetch,
    suggestions,
  } = useProductSearchSuggestions(value, maxResults);
  const panelVisible = open && normalizedQuery.length >= 2;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    setActiveIndex(-1);
    if (normalizedQuery.length < 2) setOpen(false);
  }, [normalizedQuery]);

  useEffect(() => {
    function closeOnOutsidePointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  function navigateToProduct(product) {
    setOpen(false);
    navigate(`/products/${product.id}`);
    onNavigate?.();
  }

  function navigateToResults() {
    if (!normalizedQuery) return;
    setOpen(false);
    navigate(`/products?search=${encodeURIComponent(normalizedQuery)}`);
    onNavigate?.();
  }

  function submit(event) {
    event.preventDefault();
    const activeSuggestion = suggestions[activeIndex];
    if (activeSuggestion) navigateToProduct(activeSuggestion);
    else navigateToResults();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    }
  }

  function updateValue(event) {
    const nextValue = event.target.value;
    onValueChange?.(nextValue);
    setOpen(nextValue.trim().length >= 2);
  }

  function clear() {
    onValueChange?.("");
    setOpen(false);
    inputRef.current?.focus();
  }

  const rootClasses = [
    "product-search-autocomplete",
    `product-search-autocomplete--${variant}`,
    variant === "header" ? "client-search" : "",
    value ? "has-value" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={rootClasses} ref={rootRef}>
      <form className="product-search-form" onSubmit={submit} role="search">
        <span className="client-search-icon" aria-hidden="true" />
        <input
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={panelVisible}
          aria-label={placeholder}
          autoComplete="off"
          onChange={updateValue}
          onFocus={() => normalizedQuery.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          role="combobox"
          type="search"
          value={value}
        />
        {value ? (
          <button aria-label="Effacer la recherche" className="product-search-clear" onClick={clear} type="button">
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </form>

      {panelVisible ? (
        <div className="product-search-dropdown">
          <div id={listboxId} role="listbox">
          {isDebouncing || isFetching ? (
            <div aria-label="Chargement des suggestions" className="product-search-loading">
              {Array.from({ length: 3 }, (_, index) => (
                <div className="product-search-skeleton" key={index}>
                  <Skeleton height="58px" radius="12px" width="58px" />
                  <span><Skeleton height="14px" width="80%" /><Skeleton height="11px" width="45%" /></span>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="product-search-state" role="alert">
              <strong>Impossible de charger les suggestions.</strong>
              <button onClick={() => refetch()} type="button">Réessayer</button>
            </div>
          ) : suggestions.length ? (
            <div className="product-search-results">
              {suggestions.map((product, index) => (
                <ProductSearchSuggestionItem
                  active={index === activeIndex}
                  id={`${listboxId}-option-${index}`}
                  key={product.id}
                  onFocus={() => setActiveIndex(index)}
                  onSelect={navigateToProduct}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="product-search-state">
              <strong>Aucun produit trouvé pour « {normalizedQuery} »</strong>
              <span>Essayez un autre terme ou consultez le catalogue.</span>
            </div>
          )}

          </div>

          <button className="product-search-all" onClick={navigateToResults} type="button">
            Voir tous les résultats pour « {normalizedQuery} » <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
