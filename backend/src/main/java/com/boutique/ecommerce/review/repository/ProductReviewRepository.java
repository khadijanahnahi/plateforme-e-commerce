package com.boutique.ecommerce.review.repository;

import com.boutique.ecommerce.review.entity.ProductReview;
import com.boutique.ecommerce.review.entity.ReviewStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    List<ProductReview> findByProductIdAndStatusOrderByCreatedAtDesc(Long productId, ReviewStatus status);

    List<ProductReview> findByStatusOrderByCreatedAtDesc(ReviewStatus status);

    List<ProductReview> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"product", "user"})
    List<ProductReview> findByStatusAndVerifiedPurchaseTrueOrderByCreatedAtDesc(
            ReviewStatus status,
            Pageable pageable
    );

    Optional<ProductReview> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    long countByProductIdAndStatus(Long productId, ReviewStatus status);

    @Query("""
            select coalesce(avg(r.rating), 0)
            from ProductReview r
            where r.product.id = :productId
              and r.status = :status
            """)
    Double averageRatingByProductIdAndStatus(
            @Param("productId") Long productId,
            @Param("status") ReviewStatus status
    );
}
