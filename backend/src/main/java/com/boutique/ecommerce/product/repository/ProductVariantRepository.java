package com.boutique.ecommerce.product.repository;

import com.boutique.ecommerce.product.entity.ProductVariant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    Optional<ProductVariant> findByIdAndProductId(Long id, Long productId);

    List<ProductVariant> findByProductIdAndActiveTrueOrderById(Long productId);
}
