package com.boutique.ecommerce.coupon.repository;

import com.boutique.ecommerce.coupon.entity.Coupon;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Coupon> findAllByOrderByCreatedAtDesc();
}
