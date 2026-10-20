package com.boutique.ecommerce.review.service;

import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderItemRepository;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.review.dto.ReviewEligibilityResponse;
import com.boutique.ecommerce.review.dto.LatestVerifiedReviewResponse;
import com.boutique.ecommerce.review.dto.ReviewRequest;
import com.boutique.ecommerce.review.dto.ReviewResponse;
import com.boutique.ecommerce.review.entity.ProductReview;
import com.boutique.ecommerce.review.entity.ReviewStatus;
import com.boutique.ecommerce.review.repository.ProductReviewRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    public ProductReviewService(
            ProductReviewRepository reviewRepository,
            ProductRepository productRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getApprovedReviews(Long productId) {
        ensureProductExists(productId);
        return reviewRepository.findByProductIdAndStatusOrderByCreatedAtDesc(productId, ReviewStatus.APPROVED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewEligibilityResponse getEligibility(Long productId) {
        ensureProductExists(productId);
        AppUser user = getCurrentUser();
        return resolveEligibility(user.getId(), productId);
    }

    @Transactional
    public ReviewResponse create(Long productId, ReviewRequest request) {
        Product product = ensureProductExists(productId);
        AppUser user = getCurrentUser();

        if (reviewRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            throw new IllegalArgumentException("You already reviewed this product.");
        }

        Order order = findVerifiedPurchaseOrder(user.getId(), productId);
        ProductReview review = ProductReview.builder()
                .product(product)
                .user(user)
                .order(order)
                .rating(request.rating())
                .comment(normalizeComment(request.comment()))
                .status(ReviewStatus.PENDING)
                .verifiedPurchase(true)
                .build();

        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse update(Long productId, Long reviewId, ReviewRequest request) {
        ProductReview review = reviewRepository.findByIdAndUserId(reviewId, getCurrentUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Review not found."));

        if (!review.getProduct().getId().equals(productId)) {
            throw new ResourceNotFoundException("Review not found for this product.");
        }

        review.setRating(request.rating());
        review.setComment(normalizeComment(request.comment()));
        review.setStatus(ReviewStatus.PENDING);
        return toResponse(review);
    }

    @Transactional
    public void deleteOwnReview(Long productId, Long reviewId) {
        ProductReview review = reviewRepository.findByIdAndUserId(reviewId, getCurrentUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Review not found."));

        if (!review.getProduct().getId().equals(productId)) {
            throw new ResourceNotFoundException("Review not found for this product.");
        }

        reviewRepository.delete(review);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsForAdmin(ReviewStatus status) {
        List<ProductReview> reviews = status == null
                ? reviewRepository.findAllByOrderByCreatedAtDesc()
                : reviewRepository.findByStatusOrderByCreatedAtDesc(status);
        return reviews.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ReviewResponse getByIdForAdmin(Long id) {
        return toResponse(findReview(id));
    }

    @Transactional
    public ReviewResponse approve(Long id) {
        ProductReview review = findReview(id);
        review.setStatus(ReviewStatus.APPROVED);
        return toResponse(review);
    }

    @Transactional
    public ReviewResponse reject(Long id) {
        ProductReview review = findReview(id);
        review.setStatus(ReviewStatus.REJECTED);
        return toResponse(review);
    }

    @Transactional
    public void deleteForAdmin(Long id) {
        reviewRepository.delete(findReview(id));
    }

    @Transactional(readOnly = true)
    public Double getAverageRating(Long productId) {
        return roundOneDecimal(reviewRepository.averageRatingByProductIdAndStatus(productId, ReviewStatus.APPROVED));
    }

    @Transactional(readOnly = true)
    public long getReviewCount(Long productId) {
        return reviewRepository.countByProductIdAndStatus(productId, ReviewStatus.APPROVED);
    }

    @Transactional(readOnly = true)
    public List<LatestVerifiedReviewResponse> getLatestVerifiedReviews(int requestedLimit) {
        int limit = Math.max(1, Math.min(requestedLimit, 20));
        return reviewRepository.findByStatusAndVerifiedPurchaseTrueOrderByCreatedAtDesc(
                        ReviewStatus.APPROVED,
                        PageRequest.of(0, limit)
                ).stream()
                .map(this::toLatestVerifiedResponse)
                .toList();
    }

    private ReviewEligibilityResponse resolveEligibility(Long userId, Long productId) {
        if (reviewRepository.existsByUserIdAndProductId(userId, productId)) {
            return new ReviewEligibilityResponse(false, "You already reviewed this product.");
        }

        List<OrderItem> verifiedItems = orderItemRepository.findVerifiedPurchaseItems(
                userId,
                productId,
                OrderStatus.DELIVERED,
                PaymentStatus.PAID
        );

        if (verifiedItems.isEmpty()) {
            return new ReviewEligibilityResponse(false, "Review available after delivered and paid purchase.");
        }

        return new ReviewEligibilityResponse(true, "Verified purchase.");
    }

    private Order findVerifiedPurchaseOrder(Long userId, Long productId) {
        List<OrderItem> verifiedItems = orderItemRepository.findVerifiedPurchaseItems(
                userId,
                productId,
                OrderStatus.DELIVERED,
                PaymentStatus.PAID
        );

        if (verifiedItems.isEmpty()) {
            throw new IllegalArgumentException("You can review this product only after delivered and paid purchase.");
        }

        return verifiedItems.get(0).getOrder();
    }

    private Product ensureProductExists(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
    }

    private ProductReview findReview(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found."));
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));
    }

    private String normalizeComment(String comment) {
        return comment.trim();
    }

    private Double roundOneDecimal(Double value) {
        if (value == null) {
            return 0.0;
        }
        return Math.round(value * 10.0) / 10.0;
    }

    private ReviewResponse toResponse(ProductReview review) {
        Product product = review.getProduct();
        AppUser user = review.getUser();
        Order order = review.getOrder();
        return new ReviewResponse(
                review.getId(),
                product.getId(),
                product.getName(),
                user.getId(),
                user.getFullName(),
                order.getId(),
                order.getOrderNumber(),
                review.getRating(),
                review.getComment(),
                review.getStatus(),
                review.isVerifiedPurchase(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }

    private LatestVerifiedReviewResponse toLatestVerifiedResponse(ProductReview review) {
        Product product = review.getProduct();
        return new LatestVerifiedReviewResponse(
                review.getId(),
                review.getRating(),
                review.getComment(),
                maskCustomerName(review.getUser().getFullName()),
                review.isVerifiedPurchase(),
                product.getId(),
                product.getName(),
                product.getImageUrl(),
                review.getCreatedAt()
        );
    }

    private String maskCustomerName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "Client ShopSphere";
        }

        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0];
        }
        return parts[0] + " " + Character.toUpperCase(parts[parts.length - 1].charAt(0)) + ".";
    }
}
