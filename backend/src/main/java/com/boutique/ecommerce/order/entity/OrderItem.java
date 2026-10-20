package com.boutique.ecommerce.order.entity;

import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductVariant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "order_items")
@Check(constraints = "quantity > 0 and unit_price >= 0 and subtotal >= 0")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "order_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_order_item_order")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "product_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_order_item_product")
    )
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "product_variant_id",
            foreignKey = @ForeignKey(name = "fk_order_item_product_variant")
    )
    private ProductVariant productVariant;

    @Column(name = "variant_size", length = 20)
    private String variantSize;

    @Column(name = "variant_sku", length = 100)
    private String variantSku;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "promotion_title", length = 160)
    private String promotionTitle;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    public static OrderItem fromProduct(Product product, int quantity) {
        BigDecimal unitPrice = product.getPrice();
        return fromProduct(product, null, quantity, unitPrice, null, BigDecimal.ZERO, null);
    }

    public static OrderItem fromProduct(
            Product product,
            ProductVariant variant,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal originalPrice,
            BigDecimal discountAmount,
            String promotionTitle
    ) {
        return OrderItem.builder()
                .product(product)
                .productVariant(variant)
                .productName(product.getName())
                .variantSize(variant == null ? null : variant.getSize().name())
                .variantSku(variant == null ? null : variant.getSku())
                .unitPrice(unitPrice)
                .originalPrice(originalPrice)
                .discountAmount(discountAmount == null ? BigDecimal.ZERO : discountAmount)
                .promotionTitle(promotionTitle)
                .quantity(quantity)
                .subtotal(unitPrice.multiply(BigDecimal.valueOf(quantity)))
                .build();
    }
}
