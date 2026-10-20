package com.boutique.ecommerce.coupon.controller;

import com.boutique.ecommerce.coupon.dto.CouponValidationResponse;
import com.boutique.ecommerce.coupon.dto.PublicCouponResponse;
import com.boutique.ecommerce.coupon.dto.ValidateDirectCouponRequest;
import com.boutique.ecommerce.coupon.dto.ValidateCouponRequest;
import com.boutique.ecommerce.coupon.service.CouponService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping("/public/active")
    public List<PublicCouponResponse> getActivePublicCoupons() {
        return couponService.getActivePublicCoupons();
    }

    @PostMapping("/validate")
    public CouponValidationResponse validateCoupon(@Valid @RequestBody ValidateCouponRequest request) {
        return couponService.validateForCurrentCart(request);
    }

    @PostMapping("/validate-direct")
    public CouponValidationResponse validateDirectCoupon(@Valid @RequestBody ValidateDirectCouponRequest request) {
        return couponService.validateForDirectCheckout(request);
    }
}
