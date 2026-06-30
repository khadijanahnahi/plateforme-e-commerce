package com.boutique.ecommerce.coupon.repository;

import com.boutique.ecommerce.coupon.entity.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    long countByCouponIdAndUserId(Long couponId, Long userId);
}
