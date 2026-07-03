package com.boutique.ecommerce.review.controller;

import com.boutique.ecommerce.review.dto.ReviewResponse;
import com.boutique.ecommerce.review.entity.ReviewStatus;
import com.boutique.ecommerce.review.service.ProductReviewService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RestController;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/reviews")
public class AdminReviewController {

    private final ProductReviewService reviewService;

    public AdminReviewController(ProductReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<ReviewResponse> getReviews(@RequestParam(required = false) ReviewStatus status) {
        return reviewService.getReviewsForAdmin(status);
    }

    @GetMapping("/{id}")
    public ReviewResponse getReview(@PathVariable Long id) {
        return reviewService.getByIdForAdmin(id);
    }

    @PatchMapping("/{id}/approve")
    public ReviewResponse approve(@PathVariable Long id) {
        return reviewService.approve(id);
    }

    @PatchMapping("/{id}/reject")
    public ReviewResponse reject(@PathVariable Long id) {
        return reviewService.reject(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        reviewService.deleteForAdmin(id);
    }
}
