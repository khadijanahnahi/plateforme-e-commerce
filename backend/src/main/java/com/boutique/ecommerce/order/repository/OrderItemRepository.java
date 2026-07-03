package com.boutique.ecommerce.order.repository;

import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.entity.OrderItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

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
}
