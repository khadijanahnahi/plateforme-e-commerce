package com.boutique.ecommerce.order.repository;

import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByStatus(OrderStatus status);

    long countByStatus(OrderStatus status);

    @Query("""
            select coalesce(sum(o.totalAmount), 0)
            from Order o
            where o.status <> :excludedStatus
            """)
    Optional<BigDecimal> sumRevenueExcludingStatus(@Param("excludedStatus") OrderStatus excludedStatus);

    Optional<Order> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);
}
