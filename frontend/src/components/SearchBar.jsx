export default function SearchBar({
  className = "",
  onSubmit,
  searchTerm,
  setSearchTerm,
  placeholder = "Rechercher un produit...",
}) {
  return (
    <form className={`client-search ${className}`.trim()} onSubmit={onSubmit} role="search">
      <span className="client-search-icon" aria-hidden="true" />
      <input
        type="search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        aria-label={placeholder}
      />
    </form>
  );
}
