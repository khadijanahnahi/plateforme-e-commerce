package com.boutique.ecommerce.promotion.repository;

import com.boutique.ecommerce.promotion.entity.Promotion;
import com.boutique.ecommerce.promotion.entity.PromotionStatus;
import com.boutique.ecommerce.promotion.entity.PromotionType;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    @Query("""
            select p
            from Promotion p
            join fetch p.product product
            join fetch product.category
            where p.status = com.boutique.ecommerce.promotion.entity.PromotionStatus.ACTIVE
              and p.startsAt <= :now
              and p.endsAt >= :now
              and product.status = com.boutique.ecommerce.product.entity.ProductStatus.ACTIVE
              and product.stockQuantity > 0
            order by p.priority asc, p.endsAt asc
            """)
    List<Promotion> findActivePromotions(@Param("now") LocalDateTime now);

    @Query("""
            select p
            from Promotion p
            join fetch p.product product
            join fetch product.category
            where p.status = com.boutique.ecommerce.promotion.entity.PromotionStatus.ACTIVE
              and p.promotionType = com.boutique.ecommerce.promotion.entity.PromotionType.FLASH_SALE
              and p.startsAt <= :now
              and p.endsAt >= :now
              and product.status = com.boutique.ecommerce.product.entity.ProductStatus.ACTIVE
              and product.stockQuantity > 0
            order by p.priority asc, p.endsAt asc
            """)
    List<Promotion> findActiveFlashSales(@Param("now") LocalDateTime now);

    @Query("""
            select p
            from Promotion p
            join fetch p.product product
            where product.id = :productId
              and p.status = com.boutique.ecommerce.promotion.entity.PromotionStatus.ACTIVE
              and p.startsAt <= :now
              and p.endsAt >= :now
              and product.status = com.boutique.ecommerce.product.entity.ProductStatus.ACTIVE
              and product.stockQuantity > 0
            order by p.priority asc, p.endsAt asc
            """)
    List<Promotion> findActivePromotionsForProduct(
            @Param("productId") Long productId,
            @Param("now") LocalDateTime now
    );

    @Query("""
            select (count(p) > 0)
            from Promotion p
            where p.product.id = :productId
              and p.status = com.boutique.ecommerce.promotion.entity.PromotionStatus.ACTIVE
              and (:excludedId is null or p.id <> :excludedId)
              and p.startsAt < :endsAt
              and p.endsAt > :startsAt
            """)
    boolean existsOverlappingActivePromotion(
            @Param("productId") Long productId,
            @Param("startsAt") LocalDateTime startsAt,
            @Param("endsAt") LocalDateTime endsAt,
            @Param("excludedId") Long excludedId
    );

    @Query("""
            select p
            from Promotion p
            join fetch p.product product
            join fetch product.category
            where (:status is null or p.status = :status)
              and (:type is null or p.promotionType = :type)
              and (:productId is null or product.id = :productId)
              and (
                    :activeOnly = false
                    or (
                        p.status = com.boutique.ecommerce.promotion.entity.PromotionStatus.ACTIVE
                        and p.startsAt <= :now
                        and p.endsAt >= :now
                        and product.status = com.boutique.ecommerce.product.entity.ProductStatus.ACTIVE
                        and product.stockQuantity > 0
                    )
                  )
            order by p.createdAt desc
            """)
    List<Promotion> findForAdmin(
            @Param("status") PromotionStatus status,
            @Param("type") PromotionType type,
            @Param("productId") Long productId,
            @Param("activeOnly") boolean activeOnly,
            @Param("now") LocalDateTime now
    );
}
