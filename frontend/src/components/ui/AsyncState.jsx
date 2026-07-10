import Button from "./Button";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import Skeleton from "./Skeleton";

function DefaultSkeleton({ count = 4, variant = "cards" }) {
  if (variant === "table") {
    return (
      <div className="ui-state-skeleton ui-state-skeleton-table" aria-label="Chargement en cours" role="status">
        <Skeleton height={42} />
        {Array.from({ length: count }, (_, index) => (
          <div className="ui-state-skeleton-row" key={index}>
            <Skeleton height={18} width="25%" />
            <Skeleton height={18} width="40%" />
            <Skeleton height={28} width="18%" radius={999} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ui-state-skeleton ui-state-skeleton-cards" aria-label="Chargement en cours" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div className="ui-state-skeleton-card" key={index}>
          <Skeleton height={150} />
          <Skeleton height={22} width="68%" />
          <Skeleton height={16} width="92%" />
          <Skeleton height={42} width="48%" radius={999} />
        </div>
      ))}
    </div>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8.5h14l-1 11H6l-1-11Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 9V6.8a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function AsyncState({
  children,
  empty = false,
  emptyAction,
  emptyActionLabel,
  emptyDescription = "Aucun élément à afficher pour le moment.",
  emptyIcon,
  emptyTitle = "Aucun résultat",
  error,
  loading = false,
  onEmptyAction,
  onRetry,
  skeleton,
  skeletonCount = 4,
  skeletonVariant = "cards",
}) {
  if (loading) return skeleton ?? <DefaultSkeleton count={skeletonCount} variant={skeletonVariant} />;

  if (error) {
    return (
      <ErrorState
        description={typeof error === "string" ? error : "La requête n'a pas pu aboutir. Veuillez réessayer."}
        onRetry={onRetry}
      />
    );
  }

  if (empty) {
    const action = emptyAction ?? (onEmptyAction && emptyActionLabel ? (
      <Button onClick={onEmptyAction}>{emptyActionLabel}</Button>
    ) : null);
    return (
      <EmptyState
        action={action}
        description={emptyDescription}
        icon={emptyIcon ?? <EmptyIcon />}
        title={emptyTitle}
      />
    );
  }

  return children;
}
