package com.boutique.ecommerce.wishlist.service;

import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.promotion.service.PromotionService;
import com.boutique.ecommerce.promotion.service.PromotionService.EffectivePriceResult;
import com.boutique.ecommerce.review.entity.ReviewStatus;
import com.boutique.ecommerce.review.repository.ProductReviewRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import com.boutique.ecommerce.wishlist.dto.WishlistItemResponse;
import com.boutique.ecommerce.wishlist.entity.WishlistItem;
import com.boutique.ecommerce.wishlist.repository.WishlistItemRepository;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PromotionService promotionService;
    private final ProductReviewRepository reviewRepository;

    public WishlistService(
            WishlistItemRepository wishlistItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            PromotionService promotionService,
            ProductReviewRepository reviewRepository
    ) {
        this.wishlistItemRepository = wishlistItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.promotionService = promotionService;
        this.reviewRepository = reviewRepository;
    }

    @Transactional(readOnly = true)
    public List<WishlistItemResponse> getWishlist() {
        AppUser user = getCurrentUser();
        return wishlistItemRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(item -> item.getProduct().getStatus() != ProductStatus.ARCHIVED)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public WishlistItemResponse addProduct(Long productId) {
        AppUser user = getCurrentUser();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        if (product.getStatus() == ProductStatus.ARCHIVED) {
            throw new IllegalArgumentException("Archived product cannot be added to wishlist.");
        }

        WishlistItem item = wishlistItemRepository.findByUserIdAndProductId(user.getId(), productId)
                .orElseGet(() -> wishlistItemRepository.save(WishlistItem.builder()
                        .user(user)
                        .product(product)
                        .build()));

        return toResponse(item);
    }

    @Transactional
    public void removeProduct(Long productId) {
        AppUser user = getCurrentUser();
        WishlistItem item = wishlistItemRepository.findByUserIdAndProductId(user.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist item not found."));
        wishlistItemRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public boolean exists(Long productId) {
        AppUser user = getCurrentUser();
        return wishlistItemRepository.existsByUserIdAndProductId(user.getId(), productId);
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required.");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
    }

    private WishlistItemResponse toResponse(WishlistItem item) {
        Product product = item.getProduct();
        EffectivePriceResult price = promotionService.getEffectivePrice(product);
        long reviewCount = reviewRepository.countByProductIdAndStatus(product.getId(), ReviewStatus.APPROVED);
        Double averageRating = reviewCount == 0
                ? 0.0
                : roundOneDecimal(reviewRepository.averageRatingByProductIdAndStatus(product.getId(), ReviewStatus.APPROVED));

        return new WishlistItemResponse(
                item.getId(),
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getImageUrl(),
                product.getStatus(),
                product.getStockQuantity(),
                product.getPrice(),
                price.originalPrice(),
                price.effectivePrice(),
                price.promotionActive(),
                price.promotionalPrice(),
                price.discountPercentage(),
                price.promotionEndsAt(),
                price.badgeLabel(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                averageRating,
                reviewCount,
                item.getCreatedAt()
        );
    }

    private Double roundOneDecimal(Double value) {
        if (value == null) {
            return 0.0;
        }
        return Math.round(value * 10.0) / 10.0;
    }
}
