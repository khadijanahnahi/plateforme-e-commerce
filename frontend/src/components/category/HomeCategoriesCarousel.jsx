import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import http from "../../api/http";
import { Button, EmptyState, ErrorState, Skeleton } from "../ui";

const CARD_GAP = 18;
const HOME_CATEGORY_LIMIT = 4;

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getCardsPerView(width) {
  if (width >= 1240) return 4;
  if (width >= 920) return 3;
  if (width >= 620) return 2;
  return 1;
}

function ChevronIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategorySkeletons({ count }) {
  return (
    <div className="home-categories-skeletons" aria-label="Chargement des categories" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div className="home-category-skeleton" key={index}>
          <Skeleton height={18} width="42px" />
          <Skeleton height={28} width="68%" />
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="86%" />
          <Skeleton height={18} width="94px" />
        </div>
      ))}
    </div>
  );
}

export default function HomeCategoriesCarousel() {
  const viewportRef = useRef(null);
  const touchStartXRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const {
    data: categories = [],
    error,
    isLoading: loading,
    refetch: loadCategories,
  } = useQuery({
    queryKey: ["public", "categories"],
    queryFn: async () => {
      const response = await http.get("/categories");
      return normalizeListResponse(response.data);
    },
  });
  const featuredCategories = [...categories]
    .filter((category) => Number(category.productCount ?? 0) > 0)
    .sort((first, second) => Number(second.productCount ?? 0) - Number(first.productCount ?? 0))
    .slice(0, HOME_CATEGORY_LIMIT);
  const cardsPerView = getCardsPerView(viewportWidth);
  const maxIndex = Math.max(0, featuredCategories.length - cardsPerView);
  const cardWidth = viewportWidth > 0
    ? (viewportWidth - CARD_GAP * (cardsPerView - 1)) / cardsPerView
    : 0;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const updateWidth = () => setViewportWidth(viewport.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, maxIndex));
  }, [maxIndex]);

  const trackStyle = useMemo(() => ({
    gap: `${CARD_GAP}px`,
    transform: `translate3d(-${currentIndex * (cardWidth + CARD_GAP)}px, 0, 0)`,
  }), [cardWidth, currentIndex]);

  function showPrevious() {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function showNext() {
    setCurrentIndex((index) => Math.min(maxIndex, index + 1));
  }

  function handleTouchStart(event) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event) {
    if (touchStartXRef.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const distance = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(distance) < 48) return;
    if (distance < 0) showNext();
    else showPrevious();
  }

  const showControls = !loading && featuredCategories.length > cardsPerView;

  return (
    <section className="page section-block home-categories-section" aria-labelledby="home-categories-title">
      <div className="home-categories-heading">
        <div>
          <span className="section-kicker">Categories</span>
          <h2 id="home-categories-title">Une garde-robe pensee piece par piece</h2>
          <p>Explorez des univers sobres et selectionnes pour composer votre style au quotidien.</p>
        </div>

        <div className="home-categories-actions">
          <Link className="home-categories-all-link" to="/categories">
            Voir toutes les categories <span aria-hidden="true">-&gt;</span>
          </Link>
          {showControls ? (
            <div className="home-categories-controls" aria-label="Navigation du carousel">
              <Button
                aria-label="Categories precedentes"
                className="home-category-arrow"
                disabled={currentIndex === 0}
                onClick={showPrevious}
                variant="outline"
              >
                <ChevronIcon direction="left" />
              </Button>
              <Button
                aria-label="Categories suivantes"
                className="home-category-arrow home-category-arrow-next"
                disabled={currentIndex === maxIndex}
                onClick={showNext}
              >
                <ChevronIcon direction="right" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="home-categories-viewport"
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? <CategorySkeletons count={cardsPerView} /> : null}
        {!loading && error ? (
          <ErrorState
            description={error.response?.data?.message ?? "Impossible de charger les categories."}
            onRetry={loadCategories}
          />
        ) : null}
        {!loading && !error && featuredCategories.length === 0 ? (
          <EmptyState
            description="Les categories actives apparaitront prochainement."
            title="Aucune categorie disponible"
          />
        ) : null}
        {!loading && !error && featuredCategories.length > 0 ? (
          <div className="home-categories-track" style={trackStyle}>
            {featuredCategories.map((category, index) => (
              <Link
                className="home-category-carousel-card"
                key={category.id}
                to={`/products?categoryId=${category.id}`}
                style={{
                  "--card-delay": `${Math.min(index * 55, 330)}ms`,
                  flexBasis: `${cardWidth}px`,
                  width: `${cardWidth}px`,
                }}
              >
                <span className="home-category-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="home-category-card-copy">
                  <h3>{category.name}</h3>
                  <p>{category.description ?? "Decouvrez une selection premium pensee pour le quotidien."}</p>
                </div>
                <div className="home-category-card-footer">
                  <strong>
                    {category.productCount ?? 0} {(category.productCount ?? 0) === 1 ? "produit" : "produits"}
                  </strong>
                  <span aria-hidden="true">-&gt;</span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
