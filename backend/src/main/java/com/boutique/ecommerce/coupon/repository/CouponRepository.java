package com.boutique.ecommerce.coupon.repository;

import com.boutique.ecommerce.coupon.entity.Coupon;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Coupon> findAllByOrderByCreatedAtDesc();

    @Query("""
            select coupon from Coupon coupon
            where coupon.publiclyVisible = true
              and coupon.active = true
              and (coupon.startsAt is null or coupon.startsAt <= :now)
              and (coupon.expiresAt is null or coupon.expiresAt >= :now)
              and (coupon.usageLimit is null or coupon.usedCount < coupon.usageLimit)
            order by
              case when coupon.expiresAt is null then 1 else 0 end,
              coupon.expiresAt asc,
              coupon.createdAt desc
            """)
    List<Coupon> findActivePublicCoupons(@Param("now") LocalDateTime now);
}
