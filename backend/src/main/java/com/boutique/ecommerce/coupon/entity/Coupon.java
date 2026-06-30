package com.boutique.ecommerce.coupon.entity;

import com.boutique.ecommerce.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;

@Entity
@Table(
        name = "coupons",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_coupon_code", columnNames = "code")
        }
)
@Check(constraints = "discount_value >= 0 and used_count >= 0")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupon extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 30)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "minimum_order_amount", precision = 10, scale = 2)
    private BigDecimal minimumOrderAmount;

    @Column(name = "max_discount_amount", precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Builder.Default
    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @Column(name = "per_user_limit")
    private Integer perUserLimit;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "starts_at")
    private LocalDateTime startsAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public void incrementUsedCount() {
        usedCount = usedCount + 1;
    }
}
