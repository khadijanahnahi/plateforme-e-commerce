import Select from "./Select";

export default function AdminFilterBar({
  categories = [],
  categoryFilter,
  onCategoryChange,
  onReset,
  onSearchChange,
  onSubmit,
  onStatusChange,
  search,
  statusFilter,
  statuses = [],
}) {
  return (
    <form className="admin-search admin-product-toolbar" onSubmit={onSubmit}>
      <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search product..." />
      <Select value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}>
        <option value="">Status: All</option>
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </Select>
      <Select value={categoryFilter} onChange={(event) => onCategoryChange(event.target.value)}>
        <option value="">Category: All</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </Select>
      <button className="button button-secondary" type="submit">Search</button>
      <button className="button button-secondary" type="button" onClick={onReset}>Reset filters</button>
    </form>
  );
}
