package com.boutique.ecommerce.stock.repository;

import com.boutique.ecommerce.stock.entity.StockMovement;
import com.boutique.ecommerce.stock.entity.StockMovementType;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    @Query("""
            select movement
            from StockMovement movement
            join fetch movement.product product
            left join fetch movement.order stockOrder
            left join fetch movement.admin admin
            where (:productId is null or product.id = :productId)
              and (:movementType is null or movement.movementType = :movementType)
              and (:orderId is null or stockOrder.id = :orderId)
              and (:dateFrom is null or movement.createdAt >= :dateFrom)
              and (:dateTo is null or movement.createdAt <= :dateTo)
            order by movement.createdAt desc, movement.id desc
            """)
    List<StockMovement> findForAdmin(
            @Param("productId") Long productId,
            @Param("movementType") StockMovementType movementType,
            @Param("orderId") Long orderId,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo
    );
}
