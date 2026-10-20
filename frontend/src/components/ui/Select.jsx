import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

function getOptionText(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(getOptionText).join(" ");
  if (isValidElement(value)) return getOptionText(value.props.children);
  return "";
}

function normalizeSearchValue(value) {
  return getOptionText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

function getSelectOptions(children, options, placeholder) {
  const childOptions = Children.toArray(children)
    .filter((child) => isValidElement(child) && child.type === "option")
    .map((child) => ({
      disabled: Boolean(child.props.disabled),
      label: child.props.children,
      placeholder: String(child.props.value ?? "") === "",
      value: String(child.props.value ?? child.props.children ?? ""),
    }));
  const normalized = childOptions.length
    ? childOptions
    : options.map((option) => ({ ...option, value: String(option.value ?? "") }));

  return placeholder !== undefined
    ? [{ disabled: false, label: placeholder, value: "", placeholder: true }, ...normalized]
    : normalized;
}

const Select = forwardRef(function Select({
  children,
  className = "",
  defaultValue = "",
  disabled = false,
  error,
  fullWidth = false,
  helperText,
  id,
  label,
  onChange,
  options = [],
  placeholder,
  required = false,
  searchable,
  searchPlaceholder = "Rechercher dans la liste...",
  searchThreshold = 10,
  value,
  ...props
}, forwardedRef) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = error || helperText ? `${selectId}-description` : undefined;
  const listboxId = `${selectId}-listbox`;
  const rootRef = useRef(null);
  const nativeRef = useRef(null);
  const optionRefs = useRef([]);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ""));
  const items = getSelectOptions(children, options, placeholder);
  const searchableItemsCount = items.filter((option) => !option.placeholder).length;
  const isSearchable = searchable ?? searchableItemsCount >= searchThreshold;
  const normalizedQuery = normalizeSearchValue(query);
  const filteredItems = normalizedQuery
    ? items.filter((option) => (
      !option.placeholder && normalizeSearchValue(option.label).includes(normalizedQuery)
    ))
    : items;
  const selectedValue = String(value !== undefined ? value : internalValue);
  const selectedIndex = Math.max(0, filteredItems.findIndex((option) => option.value === selectedValue));
  const selectedOption = items.find((option) => option.value === selectedValue);
  const visibleResultCount = filteredItems.filter((option) => !option.placeholder).length;

  function assignNativeRef(node) {
    nativeRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        if (isSearchable) searchRef.current?.focus();
        else optionRefs.current[selectedIndex]?.focus();
      });
    }
  }, [isSearchable, open, selectedIndex]);

  useEffect(() => {
    if (value !== undefined) return undefined;
    const form = rootRef.current?.closest("form");
    if (!form) return undefined;
    function resetSelect() {
      setInternalValue(String(defaultValue ?? ""));
      setOpen(false);
    }
    form.addEventListener("reset", resetSelect);
    return () => form.removeEventListener("reset", resetSelect);
  }, [defaultValue, value]);

  function choose(nextValue) {
    const option = items.find((item) => item.value === nextValue);
    if (!option || option.disabled) return;
    if (value === undefined) setInternalValue(nextValue);
    setOpen(false);
    setQuery("");
    onChange?.({
      target: {
        name: props.name,
        value: nextValue,
        type: "select-one",
      },
      currentTarget: nativeRef.current,
    });
  }

  function handleListKeyDown(event, index) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      let nextIndex = index;
      do {
        nextIndex = (nextIndex + direction + filteredItems.length) % filteredItems.length;
      } while (filteredItems[nextIndex]?.disabled && nextIndex !== index);
      optionRefs.current[nextIndex]?.focus();
    }
    if (event.key === "Home") {
      event.preventDefault();
      optionRefs.current[0]?.focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      optionRefs.current[filteredItems.length - 1]?.focus();
    }
  }

  function handleSearchKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const firstEnabledIndex = filteredItems.findIndex((option) => !option.disabled);
      if (firstEnabledIndex >= 0) optionRefs.current[firstEnabledIndex]?.focus();
    }
  }

  function toggleSelect() {
    setOpen((current) => {
      if (current) setQuery("");
      return !current;
    });
  }

  return (
    <div
      className={`ui-field ui-custom-select ${fullWidth ? "ui-field-full" : ""} ${error ? "ui-field-invalid" : ""} ${open ? "is-open" : ""} ${className}`}
      ref={rootRef}
    >
      {label ? <label className="ui-field-label" htmlFor={selectId}>{label}</label> : null}
      <span className="ui-select-shell">
        <button
          aria-controls={listboxId}
          aria-describedby={descriptionId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={Boolean(error)}
          aria-label={props["aria-label"] ?? label}
          className="ui-select-trigger"
          disabled={disabled}
          id={selectId}
          onClick={toggleSelect}
          type="button"
        >
          <span className={!selectedOption || selectedOption.placeholder ? "is-placeholder" : ""}>
            {selectedOption?.label ?? placeholder ?? "Sélectionner"}
          </span>
          <span className="ui-select-chevron" aria-hidden="true" />
        </button>

        {open ? (
          <span className="ui-select-popover">
            {isSearchable ? (
              <span className="ui-select-search">
                <span className="ui-select-search-icon" aria-hidden="true" />
                <input
                  aria-label="Rechercher une option"
                  autoComplete="off"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  ref={searchRef}
                  type="search"
                  value={query}
                />
              </span>
            ) : null}

            <span className="ui-select-options" id={listboxId} role="listbox" aria-label={label ?? props["aria-label"]}>
              {filteredItems.length ? filteredItems.map((option, index) => (
                <button
                  aria-selected={option.value === selectedValue}
                  className={`ui-select-option ${option.value === selectedValue ? "is-selected" : ""} ${option.placeholder ? "is-placeholder" : ""}`}
                  disabled={option.disabled}
                  key={`${option.value}-${index}`}
                  onClick={() => choose(option.value)}
                  onKeyDown={(event) => handleListKeyDown(event, index)}
                  ref={(node) => { optionRefs.current[index] = node; }}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  <span>{option.label}</span>
                  {option.value === selectedValue ? <span className="ui-select-check" aria-hidden="true">✓</span> : null}
                </button>
              )) : (
                <span className="ui-select-empty">Aucun résultat trouvé</span>
              )}
            </span>

            {isSearchable ? (
              <span className="ui-select-results-count" aria-live="polite">
                {visibleResultCount} {visibleResultCount > 1 ? "résultats" : "résultat"}
              </span>
            ) : null}
          </span>
        ) : null}

        <select
          {...props}
          aria-hidden="true"
          className="ui-select-native"
          disabled={disabled}
          onChange={() => {}}
          ref={assignNativeRef}
          required={required}
          tabIndex={-1}
          value={selectedValue}
        >
          {items.map((option, index) => (
            <option disabled={option.disabled} key={`${option.value}-${index}`} value={option.value}>{option.label}</option>
          ))}
        </select>
      </span>
      {error ? <span className="ui-field-message ui-field-error" id={descriptionId}>{error}</span> : helperText ? <span className="ui-field-message" id={descriptionId}>{helperText}</span> : null}
    </div>
  );
});

export default Select;
