package com.boutique.ecommerce.promotion.service;

import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.product.dto.ProductResponse;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.promotion.dto.PromotionProductResponse;
import com.boutique.ecommerce.promotion.dto.PromotionRequest;
import com.boutique.ecommerce.promotion.dto.PromotionResponse;
import com.boutique.ecommerce.promotion.entity.Promotion;
import com.boutique.ecommerce.promotion.entity.PromotionStatus;
import com.boutique.ecommerce.promotion.entity.PromotionType;
import com.boutique.ecommerce.promotion.repository.PromotionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PromotionService {

    private static final Logger log = LoggerFactory.getLogger(PromotionService.class);

    private final PromotionRepository promotionRepository;
    private final ProductRepository productRepository;

    public PromotionService(PromotionRepository promotionRepository, ProductRepository productRepository) {
        this.promotionRepository = promotionRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<PromotionResponse> getActivePromotions() {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findActivePromotions(now)
                .stream()
                .map(promotion -> toResponse(promotion, now))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromotionProductResponse> getActiveFlashSales() {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findActiveFlashSales(now)
                .stream()
                .map(promotion -> toProductResponse(promotion, now))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromotionResponse> getPromotionsForAdmin(
            PromotionStatus status,
            PromotionType type,
            Long productId,
            boolean activeOnly
    ) {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findForAdmin(status, type, productId, activeOnly, now)
                .stream()
                .map(promotion -> toResponse(promotion, now))
                .toList();
    }

    @Transactional(readOnly = true)
    public PromotionResponse getByIdForAdmin(Long id) {
        Promotion promotion = findPromotion(id);
        return toResponse(promotion, LocalDateTime.now());
    }

    @Transactional
    public PromotionResponse create(PromotionRequest request) {
        Product product = findProduct(request.productId());
        validateProduct(product);
        validateRequest(request, product, null);

        Promotion promotion = Promotion.builder()
                .product(product)
                .title(normalizeRequired(request.title()))
                .description(normalizeOptional(request.description()))
                .promotionType(request.promotionType())
                .originalPrice(product.getPrice())
                .promotionalPrice(normalizeMoney(request.promotionalPrice()))
                .discountPercentage(calculateDiscountPercentage(product.getPrice(), request.promotionalPrice()))
                .startsAt(request.startsAt())
                .endsAt(request.endsAt())
                .status(request.status() == null ? PromotionStatus.DRAFT : request.status())
                .priority(request.priority() == null ? 100 : request.priority())
                .badgeLabel(normalizeOptional(request.badgeLabel()))
                .build();

        Promotion savedPromotion = promotionRepository.save(promotion);
        log.info("promotion created id={} productId={} status={}", savedPromotion.getId(), product.getId(), savedPromotion.getStatus());
        return toResponse(savedPromotion, LocalDateTime.now());
    }

    @Transactional
    public PromotionResponse update(Long id, PromotionRequest request) {
        Promotion promotion = findPromotion(id);
        Product product = findProduct(request.productId());
        validateProduct(product);
        validateRequest(request, product, id);

        promotion.setProduct(product);
        promotion.setTitle(normalizeRequired(request.title()));
        promotion.setDescription(normalizeOptional(request.description()));
        promotion.setPromotionType(request.promotionType());
        promotion.setOriginalPrice(product.getPrice());
        promotion.setPromotionalPrice(normalizeMoney(request.promotionalPrice()));
        promotion.setDiscountPercentage(calculateDiscountPercentage(product.getPrice(), request.promotionalPrice()));
        promotion.setStartsAt(request.startsAt());
        promotion.setEndsAt(request.endsAt());
        promotion.setStatus(request.status() == null ? promotion.getStatus() : request.status());
        promotion.setPriority(request.priority() == null ? 100 : request.priority());
        promotion.setBadgeLabel(normalizeOptional(request.badgeLabel()));

        log.info("promotion updated id={} productId={} status={}", promotion.getId(), product.getId(), promotion.getStatus());
        return toResponse(promotion, LocalDateTime.now());
    }

    @Transactional
    public PromotionResponse activate(Long id) {
        Promotion promotion = findPromotion(id);
        validatePromotionCanBeActive(promotion, id);
        promotion.activate();
        log.info("promotion activated id={} productId={}", promotion.getId(), promotion.getProduct().getId());
        return toResponse(promotion, LocalDateTime.now());
    }

    @Transactional
    public PromotionResponse deactivate(Long id) {
        Promotion promotion = findPromotion(id);
        promotion.deactivate();
        log.info("promotion deactivated id={} productId={}", promotion.getId(), promotion.getProduct().getId());
        return toResponse(promotion, LocalDateTime.now());
    }

    @Transactional
    public PromotionResponse expire(Long id) {
        Promotion promotion = findPromotion(id);
        promotion.expire();
        log.info("promotion expired id={} productId={}", promotion.getId(), promotion.getProduct().getId());
        return toResponse(promotion, LocalDateTime.now());
    }

    @Transactional
    public PromotionResponse delete(Long id) {
        Promotion promotion = findPromotion(id);
        promotion.deactivate();
        log.info("promotion soft deleted id={} productId={}", promotion.getId(), promotion.getProduct().getId());
        return toResponse(promotion, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public EffectivePriceResult getEffectivePrice(Product product) {
        if (product == null || product.getId() == null) {
            return EffectivePriceResult.noPromotion(BigDecimal.ZERO);
        }

        BigDecimal originalPrice = product.getPrice();
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findActivePromotionsForProduct(product.getId(), now)
                .stream()
                .findFirst()
                .map(promotion -> {
                    log.debug("promotion applied to product productId={} promotionId={}", product.getId(), promotion.getId());
                    return EffectivePriceResult.fromPromotion(promotion);
                })
                .orElseGet(() -> {
                    log.debug("promotion skipped because expired/inactive productId={}", product.getId());
                    return EffectivePriceResult.noPromotion(originalPrice);
                });
    }

    private Promotion findPromotion(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found."));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
    }

    private void validateProduct(Product product) {
        if (product.getStatus() == ProductStatus.ARCHIVED) {
            throw new IllegalArgumentException("Cannot create promotion for archived product.");
        }
    }

    private void validateRequest(PromotionRequest request, Product product, Long currentPromotionId) {
        if (!request.endsAt().isAfter(request.startsAt())) {
            throw new IllegalArgumentException("Promotion end date must be after start date.");
        }
        if (request.promotionalPrice().compareTo(product.getPrice()) >= 0) {
            throw new IllegalArgumentException("Promotional price must be lower than product price.");
        }
        if (request.status() == PromotionStatus.ACTIVE) {
            validateNoOverlap(product.getId(), request.startsAt(), request.endsAt(), currentPromotionId);
        }
    }

    private void validatePromotionCanBeActive(Promotion promotion, Long excludedId) {
        if (promotion.getPromotionalPrice().compareTo(promotion.getProduct().getPrice()) >= 0) {
            throw new IllegalArgumentException("Promotional price must be lower than product price.");
        }
        validateNoOverlap(promotion.getProduct().getId(), promotion.getStartsAt(), promotion.getEndsAt(), excludedId);
    }

    private void validateNoOverlap(Long productId, LocalDateTime startsAt, LocalDateTime endsAt, Long excludedId) {
        if (promotionRepository.existsOverlappingActivePromotion(productId, startsAt, endsAt, excludedId)) {
            throw new IllegalArgumentException("An active overlapping promotion already exists for this product.");
        }
    }

    private PromotionResponse toResponse(Promotion promotion, LocalDateTime now) {
        Product product = promotion.getProduct();
        return new PromotionResponse(
                promotion.getId(),
                product.getId(),
                product.getName(),
                promotion.getTitle(),
                promotion.getDescription(),
                promotion.getPromotionType(),
                promotion.getOriginalPrice(),
                promotion.getPromotionalPrice(),
                promotion.getDiscountPercentage(),
                promotion.getStartsAt(),
                promotion.getEndsAt(),
                promotion.getStatus(),
                promotion.getPriority(),
                promotion.getBadgeLabel(),
                isActiveNow(promotion, now),
                promotion.getCreatedAt(),
                promotion.getUpdatedAt()
        );
    }

    private PromotionProductResponse toProductResponse(Promotion promotion, LocalDateTime now) {
        Product product = promotion.getProduct();
        EffectivePriceResult price = EffectivePriceResult.fromPromotion(promotion);
        ProductResponse productResponse = new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                price.originalPrice(),
                price.effectivePrice(),
                price.promotionActive(),
                price.promotionalPrice(),
                price.discountPercentage(),
                price.promotionEndsAt(),
                price.badgeLabel(),
                product.getStockQuantity(),
                product.getImageUrl(),
                product.getSku(),
                product.getStatus(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                0.0,
                0L,
                product.getCreatedAt(),
                product.getUpdatedAt(),
                product.getAudience(),
                product.getVariants().stream()
                        .filter(variant -> Boolean.TRUE.equals(variant.getActive()))
                        .map(variant -> new com.boutique.ecommerce.product.dto.ProductVariantResponse(
                                variant.getId(), variant.getSize(), variant.getSku(),
                                variant.getStockQuantity(), variant.getActive()))
                        .toList()
        );
        return new PromotionProductResponse(
                promotion.getId(),
                promotion.getTitle(),
                promotion.getBadgeLabel(),
                promotion.getOriginalPrice(),
                promotion.getPromotionalPrice(),
                promotion.getDiscountPercentage(),
                promotion.getEndsAt(),
                promotion.getPriority(),
                productResponse
        );
    }

    private boolean isActiveNow(Promotion promotion, LocalDateTime now) {
        Product product = promotion.getProduct();
        return promotion.getStatus() == PromotionStatus.ACTIVE
                && !promotion.getStartsAt().isAfter(now)
                && !promotion.getEndsAt().isBefore(now)
                && product.getStatus() == ProductStatus.ACTIVE
                && product.getStockQuantity() > 0;
    }

    private BigDecimal calculateDiscountPercentage(BigDecimal originalPrice, BigDecimal promotionalPrice) {
        BigDecimal discount = originalPrice.subtract(promotionalPrice);
        return discount
                .multiply(BigDecimal.valueOf(100))
                .divide(originalPrice, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeRequired(String value) {
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public record EffectivePriceResult(
            BigDecimal originalPrice,
            BigDecimal effectivePrice,
            BigDecimal promotionalPrice,
            BigDecimal discountPercentage,
            Boolean promotionActive,
            String promotionTitle,
            LocalDateTime promotionEndsAt,
            String badgeLabel
    ) {
        static EffectivePriceResult noPromotion(BigDecimal price) {
            return new EffectivePriceResult(price, price, null, null, false, null, null, null);
        }

        static EffectivePriceResult fromPromotion(Promotion promotion) {
            return new EffectivePriceResult(
                    promotion.getOriginalPrice(),
                    promotion.getPromotionalPrice(),
                    promotion.getPromotionalPrice(),
                    promotion.getDiscountPercentage(),
                    true,
                    promotion.getTitle(),
                    promotion.getEndsAt(),
                    promotion.getBadgeLabel()
            );
        }

        public BigDecimal discountAmount() {
            return promotionActive ? originalPrice.subtract(effectivePrice) : BigDecimal.ZERO;
        }
    }
}
