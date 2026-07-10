import Button from "./Button";

function getVisiblePages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((left, right) => left - right);
  return sorted.reduce((result, value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push(`ellipsis-${value}`);
    result.push(value);
    return result;
  }, []);
}

export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <Button aria-label="Page précédente" disabled={page <= 1} size="sm" variant="outline" onClick={() => onPageChange(page - 1)}>Précédent</Button>
      <div className="ui-pagination-pages">
        {visiblePages.map((item) => typeof item === "string" ? (
          <span className="ui-pagination-ellipsis" key={item}>…</span>
        ) : (
          <button aria-current={item === page ? "page" : undefined} className={item === page ? "is-active" : ""} key={item} type="button" onClick={() => onPageChange(item)}>{item}</button>
        ))}
      </div>
      <Button aria-label="Page suivante" disabled={page >= totalPages} size="sm" variant="outline" onClick={() => onPageChange(page + 1)}>Suivant</Button>
    </nav>
  );
}
