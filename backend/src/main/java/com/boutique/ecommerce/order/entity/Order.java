package com.boutique.ecommerce.order.entity;

import com.boutique.ecommerce.common.AuditableEntity;
import com.boutique.ecommerce.user.entity.AppUser;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;

@Entity
@Table(
        name = "orders",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_order_number", columnNames = "order_number")
        }
)
@Check(constraints = "total_amount >= 0 and status in ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') and payment_status in ('UNPAID', 'PAID', 'FAILED')")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_order_user")
    )
    private AppUser user;

    @Column(name = "customer_name", length = 120)
    private String customerName;

    @Column(name = "customer_email", length = 180)
    private String customerEmail;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Builder.Default
    @Column(name = "subtotal_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.PENDING;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(name = "shipping_address", columnDefinition = "text")
    private String shippingAddress;

    @Column(name = "shipping_street_address", columnDefinition = "text")
    private String shippingStreetAddress;

    @Column(name = "shipping_city", length = 100)
    private String shippingCity;

    @Column(name = "shipping_postal_code", length = 30)
    private String shippingPostalCode;

    @Column(name = "delivery_notes", columnDefinition = "text")
    private String deliveryNotes;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
