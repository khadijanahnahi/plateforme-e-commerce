package com.boutique.ecommerce.stock.repository;

import com.boutique.ecommerce.stock.entity.StockMovement;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long>, JpaSpecificationExecutor<StockMovement> {

    boolean existsByProductId(Long productId);

    @Override
    @EntityGraph(attributePaths = {"product", "order", "admin"})
    List<StockMovement> findAll(Specification<StockMovement> specification, Sort sort);
}
