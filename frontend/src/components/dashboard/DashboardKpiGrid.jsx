import { useEffect, useRef, useState } from "react";

function AnimatedValue({ money, value }) {
  const target = Number(value ?? 0);
  const previousValue = useRef(0);
  const [displayedValue, setDisplayedValue] = useState(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const difference = target - startValue;
    const duration = 850;
    const startedAt = performance.now();
    let frameId;

    function animate(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - ((1 - progress) ** 3);
      setDisplayedValue(startValue + (difference * easedProgress));
      if (progress < 1) frameId = requestAnimationFrame(animate);
      else previousValue.current = target;
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  const formattedValue = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: money ? 2 : 0,
    maximumFractionDigits: money ? 2 : 0,
  }).format(displayedValue);

  return <>{formattedValue}{money ? " DH" : ""}</>;
}

export default function DashboardKpiGrid({ cards }) {
  return (
    <div className="dashboard-kpi-grid" aria-label="Indicateurs principaux">
      {cards.map((card, index) => (
        <article className="dashboard-kpi-card reveal-card" key={card.label} style={{ "--delay": `${index * 0.06}s` }}>
          <span>{card.label}</span>
          <strong><AnimatedValue money={card.money} value={card.value} /></strong>
          <small>{card.helper}</small>
        </article>
      ))}
    </div>
  );
}
