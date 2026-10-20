export default function Skeleton({ className = "", height, radius, width }) {
  return (
    <span
      aria-hidden="true"
      className={`ui-skeleton ${className}`}
      style={{ height, borderRadius: radius, width }}
    />
  );
}
