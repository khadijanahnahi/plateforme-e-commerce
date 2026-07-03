package com.boutique.ecommerce.review.controller;

import com.boutique.ecommerce.review.dto.ReviewEligibilityResponse;
import com.boutique.ecommerce.review.dto.ReviewRequest;
import com.boutique.ecommerce.review.dto.ReviewResponse;
import com.boutique.ecommerce.review.service.ProductReviewService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ProductReviewController {

    private final ProductReviewService reviewService;

    public ProductReviewController(ProductReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<ReviewResponse> getApprovedReviews(@PathVariable Long productId) {
        return reviewService.getApprovedReviews(productId);
    }

    @GetMapping("/eligibility")
    @PreAuthorize("isAuthenticated()")
    public ReviewEligibilityResponse getEligibility(@PathVariable Long productId) {
        return reviewService.getEligibility(productId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ReviewResponse create(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request
    ) {
        return reviewService.create(productId, request);
    }

    @PutMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ReviewResponse update(
            @PathVariable Long productId,
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request
    ) {
        return reviewService.update(productId, reviewId, request);
    }

    @DeleteMapping("/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    public void delete(
            @PathVariable Long productId,
            @PathVariable Long reviewId
    ) {
        reviewService.deleteOwnReview(productId, reviewId);
    }
}
