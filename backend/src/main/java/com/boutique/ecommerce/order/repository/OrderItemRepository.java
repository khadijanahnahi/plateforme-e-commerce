package com.boutique.ecommerce.order.repository;

import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.product.entity.ProductStatus;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    interface BestSellerProjection {
        Long getProductId();

        Long getQuantitySold();
    }

    List<OrderItem> findByOrderId(Long orderId);

    boolean existsByProductId(Long productId);

    @Query("""
            select oi
            from OrderItem oi
            join fetch oi.order o
            where o.user.id = :userId
              and oi.product.id = :productId
              and o.status = :orderStatus
              and o.paymentStatus = :paymentStatus
            order by o.createdAt desc
            """)
    List<OrderItem> findVerifiedPurchaseItems(
            @Param("userId") Long userId,
            @Param("productId") Long productId,
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("paymentStatus") PaymentStatus paymentStatus
    );

    @Query("""
            select oi.product.id as productId, sum(oi.quantity) as quantitySold
            from OrderItem oi
            join oi.order o
            join oi.product p
            where o.status = :orderStatus
              and o.paymentStatus = :paymentStatus
              and p.status in :productStatuses
            group by oi.product.id
            order by sum(oi.quantity) desc, oi.product.id asc
            """)
    List<BestSellerProjection> findBestSellers(
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("productStatuses") List<ProductStatus> productStatuses,
            Pageable pageable
    );
}
