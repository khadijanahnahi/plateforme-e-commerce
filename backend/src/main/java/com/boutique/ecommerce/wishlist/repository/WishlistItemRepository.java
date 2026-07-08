package com.boutique.ecommerce.wishlist.repository;

import com.boutique.ecommerce.wishlist.entity.WishlistItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    @Query("""
            select wi
            from WishlistItem wi
            join fetch wi.product p
            join fetch p.category
            where wi.user.id = :userId
            order by wi.createdAt desc
            """)
    List<WishlistItem> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);
}
