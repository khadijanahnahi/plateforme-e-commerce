import { useState } from "react";
import { Button } from "../ui";
import { usePublicCoupons } from "../../hooks/usePublicCoupons";
import { useToast } from "../../hooks/useToast";

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function getDiscountLabel(coupon) {
  return coupon.discountType === "PERCENTAGE"
    ? `-${Number(coupon.discountValue)} %`
    : `-${formatMoney(coupon.discountValue)}`;
}

function getConditions(coupon) {
  const conditions = [];
  if (coupon.minimumOrderAmount) {
    conditions.push(`dès ${formatMoney(coupon.minimumOrderAmount)}`);
  }
  if (coupon.expiresAt) {
    conditions.push(`jusqu'au ${formatDate(coupon.expiresAt)}`);
  }
  return conditions.join(" · ");
}

export default function PublicCouponOffers({
  className = "",
  limit = 1,
  onApply,
  variant = "home",
}) {
  const { data: coupons = [], isLoading } = usePublicCoupons({
    alwaysFresh: variant === "checkout",
  });
  const [pendingCode, setPendingCode] = useState("");
  const toast = useToast();
  const visibleCoupons = coupons.slice(0, limit);

  async function copyCode(code) {
    setPendingCode(code);
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Code ${code} copié.`);
    } catch {
      toast.error("Impossible de copier le code automatiquement.");
    } finally {
      setPendingCode("");
    }
  }

  async function handleAction(coupon) {
    if (onApply) {
      setPendingCode(coupon.code);
      try {
        await onApply(coupon.code);
      } finally {
        setPendingCode("");
      }
      return;
    }
    await copyCode(coupon.code);
  }

  if (isLoading || visibleCoupons.length === 0) {
    return null;
  }

  return (
    <section
      className={`public-coupon-offers public-coupon-offers-${variant} ${className}`.trim()}
      aria-label="Coupons publics disponibles"
    >
      {variant === "home" ? <span className="public-coupon-eyebrow">Offre du moment</span> : null}
      <div className="public-coupon-list">
        {visibleCoupons.map((coupon) => (
          <article className="public-coupon-card" key={coupon.id}>
            <div className="public-coupon-mark" aria-hidden="true">%</div>
            <div className="public-coupon-copy">
              <span>{coupon.name}</span>
              <strong>{getDiscountLabel(coupon)} avec le code <b>{coupon.code}</b></strong>
              {getConditions(coupon) ? <small>{getConditions(coupon)}</small> : null}
            </div>
            <Button
              className="public-coupon-action"
              loading={pendingCode === coupon.code}
              size="sm"
              variant={variant === "home" ? "primary" : "outline"}
              onClick={() => handleAction(coupon)}
            >
              {onApply ? "Appliquer" : "Copier le code"}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
