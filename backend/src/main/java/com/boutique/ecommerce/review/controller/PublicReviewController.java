package com.boutique.ecommerce.review.controller;

import com.boutique.ecommerce.review.dto.LatestVerifiedReviewResponse;
import com.boutique.ecommerce.review.service.ProductReviewService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class PublicReviewController {

    private final ProductReviewService reviewService;

    public PublicReviewController(ProductReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/latest")
    public List<LatestVerifiedReviewResponse> getLatest(@RequestParam(defaultValue = "6") int limit) {
        return reviewService.getLatestVerifiedReviews(limit);
    }
}
