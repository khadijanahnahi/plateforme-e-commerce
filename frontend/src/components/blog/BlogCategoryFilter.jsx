export default function BlogCategoryFilter({ categories, selected, onChange }) {
  return <div className="blog-category-filter" aria-label="Catégories du blog"><button className={!selected ? "is-active" : ""} type="button" onClick={() => onChange("")}>Tous</button>{categories.map((category) => <button className={selected === category.slug ? "is-active" : ""} key={category.id} type="button" onClick={() => onChange(category.slug)}>{category.name}</button>)}</div>;
}
