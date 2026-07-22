package com.boutique.ecommerce.returnrequest.repository;

import com.boutique.ecommerce.returnrequest.entity.ReturnRequest;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    boolean existsByUserIdAndOrderItemId(Long userId, Long orderItemId);

    @Query("select request.orderItem.id from ReturnRequest request where request.user.id = :userId")
    Set<Long> findRequestedOrderItemIds(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"order", "orderItem", "orderItem.product"})
    List<ReturnRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"order", "orderItem", "orderItem.product", "user"})
    List<ReturnRequest> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"order", "orderItem", "orderItem.product", "user"})
    Optional<ReturnRequest> findById(Long id);

    @EntityGraph(attributePaths = {"order", "orderItem", "orderItem.product"})
    Optional<ReturnRequest> findByIdAndUserId(Long id, Long userId);
}
