package com.boutique.ecommerce.coupon.controller;

import com.boutique.ecommerce.coupon.dto.CouponRequest;
import com.boutique.ecommerce.coupon.dto.CouponResponse;
import com.boutique.ecommerce.coupon.service.CouponService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/coupons")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public List<CouponResponse> getAll() {
        return couponService.getAll();
    }

    @GetMapping("/{id}")
    public CouponResponse getById(@PathVariable Long id) {
        return couponService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CouponResponse create(@Valid @RequestBody CouponRequest request) {
        return couponService.create(request);
    }

    @PutMapping("/{id}")
    public CouponResponse update(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        return couponService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    public CouponResponse activate(@PathVariable Long id) {
        return couponService.activate(id);
    }

    @PatchMapping("/{id}/deactivate")
    public CouponResponse deactivate(@PathVariable Long id) {
        return couponService.deactivate(id);
    }
}
