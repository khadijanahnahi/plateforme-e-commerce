package com.boutique.ecommerce.product.service;

import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.order.repository.OrderItemRepository;
import com.boutique.ecommerce.product.dto.ProductRequest;
import com.boutique.ecommerce.product.dto.ProductResponse;
import com.boutique.ecommerce.product.dto.ProductSearchSuggestionResponse;
import com.boutique.ecommerce.product.dto.UpdateProductStatusRequest;
import com.boutique.ecommerce.product.dto.UpdateProductStockRequest;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.promotion.repository.PromotionRepository;
import com.boutique.ecommerce.promotion.service.PromotionService;
import com.boutique.ecommerce.promotion.service.PromotionService.EffectivePriceResult;
import com.boutique.ecommerce.review.entity.ReviewStatus;
import com.boutique.ecommerce.review.repository.ProductReviewRepository;
import com.boutique.ecommerce.stock.repository.StockMovementRepository;
import com.boutique.ecommerce.stock.service.StockMovementService;
import com.boutique.ecommerce.wishlist.repository.WishlistItemRepository;
import com.boutique.ecommerce.blog.repository.BlogPostRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private static final List<ProductStatus> PUBLIC_STATUSES = List.of(
            ProductStatus.ACTIVE,
            ProductStatus.OUT_OF_STOCK
    );

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductReviewRepository reviewRepository;
    private final PromotionService promotionService;
    private final StockMovementService stockMovementService;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final PromotionRepository promotionRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final BlogPostRepository blogPostRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            ProductReviewRepository reviewRepository,
            PromotionService promotionService,
            StockMovementService stockMovementService,
            OrderItemRepository orderItemRepository,
            CartItemRepository cartItemRepository,
            PromotionRepository promotionRepository,
            WishlistItemRepository wishlistItemRepository,
            StockMovementRepository stockMovementRepository,
            BlogPostRepository blogPostRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.reviewRepository = reviewRepository;
        this.promotionService = promotionService;
        this.stockMovementService = stockMovementService;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.promotionRepository = promotionRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.blogPostRepository = blogPostRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getVisibleProducts(String search, Long categoryId) {
        String normalizedSearch = normalizeSearch(search);
        List<Product> products = normalizedSearch == null
                ? productRepository.findVisibleProducts(PUBLIC_STATUSES, categoryId)
                : productRepository.searchVisibleProducts(PUBLIC_STATUSES, toSearchPattern(normalizedSearch), categoryId);

        return products
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getVisibleProductsPage(String search, Long categoryId, int page, int size) {
        String normalizedSearch = normalizeSearch(search);
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.min(48, Math.max(1, size)));
        Page<Product> products = normalizedSearch == null
                ? productRepository.findVisibleProductsPage(PUBLIC_STATUSES, categoryId, pageRequest)
                : productRepository.searchVisibleProductsPage(
                        PUBLIC_STATUSES,
                        toSearchPattern(normalizedSearch),
                        categoryId,
                        pageRequest
                );

        return products.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<ProductSearchSuggestionResponse> searchSuggestions(String query, int limit) {
        String normalizedQuery = normalizeOptional(query);
        if (normalizedQuery == null || normalizedQuery.length() < 2) {
            throw new IllegalArgumentException("Search query must contain at least 2 characters.");
        }
        if (normalizedQuery.length() > 100) {
            throw new IllegalArgumentException("Search query must not exceed 100 characters.");
        }

        String loweredQuery = normalizedQuery.toLowerCase(Locale.ROOT);
        int safeLimit = Math.min(10, Math.max(1, limit));
        return productRepository.findSearchSuggestions(
                        PUBLIC_STATUSES,
                        loweredQuery,
                        loweredQuery + "%",
                        "%" + loweredQuery + "%",
                        PageRequest.of(0, safeLimit)
                )
                .stream()
                .map(this::toSearchSuggestionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getVisibleById(Long id) {
        Product product = productRepository.findByIdAndStatusIn(id, PUBLIC_STATUSES)
                .orElseThrow(() -> new ResourceNotFoundException("Visible product not found."));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsForAdmin(String search, Long categoryId) {
        String normalizedSearch = normalizeSearch(search);
        List<Product> products = normalizedSearch == null
                ? productRepository.findProductsForAdmin(categoryId)
                : productRepository.searchProductsForAdmin(toSearchPattern(normalizedSearch), categoryId);

        return products
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getByIdForAdmin(Long id) {
        return toResponse(findProduct(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = findActiveCategory(request.categoryId());
        String sku = normalizeOptional(request.sku());
        validateUniqueSku(sku, null);

        Product product = Product.builder()
                .name(normalizeRequired(request.name()))
                .description(normalizeOptional(request.description()))
                .price(request.price())
                .stockQuantity(request.stockQuantity())
                .imageUrl(normalizeOptional(request.imageUrl()))
                .sku(sku)
                .status(resolveStatus(request.status(), request.stockQuantity()))
                .category(category)
                .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = findProduct(id);
        int stockBefore = product.getStockQuantity();
        Category category = findActiveCategory(request.categoryId());
        String sku = normalizeOptional(request.sku());
        validateUniqueSku(sku, id);

        product.setName(normalizeRequired(request.name()));
        product.setDescription(normalizeOptional(request.description()));
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
        product.setImageUrl(normalizeOptional(request.imageUrl()));
        product.setSku(sku);
        product.setStatus(resolveStatus(request.status(), request.stockQuantity()));
        product.setCategory(category);
        stockMovementService.recordManualAdjustment(product, stockBefore, request.stockQuantity());

        return toResponse(product);
    }

    @Transactional
    public ProductResponse updateStock(Long id, UpdateProductStockRequest request) {
        Product product = findProduct(id);
        int stockBefore = product.getStockQuantity();
        product.setStockQuantity(request.stockQuantity());

        if (request.stockQuantity() == 0 && product.getStatus() == ProductStatus.ACTIVE) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else if (request.stockQuantity() > 0 && product.getStatus() == ProductStatus.OUT_OF_STOCK) {
            product.setStatus(ProductStatus.ACTIVE);
        }

        stockMovementService.recordManualAdjustment(product, stockBefore, request.stockQuantity());

        return toResponse(product);
    }

    @Transactional
    public ProductResponse updateStatus(Long id, UpdateProductStatusRequest request) {
        Product product = findProduct(id);
        product.setStatus(resolveStatus(request.status(), product.getStockQuantity()));
        return toResponse(product);
    }

    @Transactional
    public ProductResponse archive(Long id) {
        Product product = findProduct(id);
        product.archive();
        return toResponse(product);
    }

    @Transactional
    public void deletePermanently(Long id) {
        Product product = findProduct(id);
        assertProductCanBeDeleted(id);

        if (cartItemRepository.existsByProductId(id)) {
            cartItemRepository.deleteByProductId(id);
        }
        if (wishlistItemRepository.existsByProductId(id)) {
            wishlistItemRepository.deleteByProductId(id);
        }

        productRepository.delete(product);
    }

    private void assertProductCanBeDeleted(Long productId) {
        if (orderItemRepository.existsByProductId(productId)) {
            throw new ResourceConflictException("Cannot delete this product because it is linked to orders. Archive it instead.");
        }
        if (promotionRepository.existsByProductId(productId)) {
            throw new ResourceConflictException("Cannot delete this product because it is linked to promotions. Delete its promotions first or archive it.");
        }
        if (reviewRepository.existsByProductId(productId)) {
            throw new ResourceConflictException("Cannot delete this product because it has reviews. Archive it instead.");
        }
        if (stockMovementRepository.existsByProductId(productId)) {
            throw new ResourceConflictException("Cannot delete this product because it has stock history. Archive it instead.");
        }
        if (blogPostRepository.existsByProductsId(productId)) {
            throw new ResourceConflictException("Cannot delete this product because it is linked to a blog post. Remove the association first.");
        }
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
    }

    private Category findActiveCategory(Long categoryId) {
        return categoryRepository.findByIdAndActiveTrue(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Active category not found."));
    }

    private void validateUniqueSku(String sku, Long currentProductId) {
        if (sku == null) {
            return;
        }

        productRepository.findBySkuIgnoreCase(sku)
                .filter(product -> currentProductId == null || !product.getId().equals(currentProductId))
                .ifPresent(product -> {
                    throw new ResourceConflictException("Product SKU already exists.");
                });
    }

    private ProductStatus resolveStatus(ProductStatus requestedStatus, Integer stockQuantity) {
        ProductStatus status = requestedStatus == null ? ProductStatus.ACTIVE : requestedStatus;
        if (status == ProductStatus.ACTIVE && stockQuantity == 0) {
            return ProductStatus.OUT_OF_STOCK;
        }
        return status;
    }

    private String normalizeSearch(String value) {
        return normalizeOptional(value);
    }

    private String toSearchPattern(String value) {
        return "%" + value.toLowerCase() + "%";
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

    private ProductResponse toResponse(Product product) {
        Category category = product.getCategory();
        Long productId = product.getId();
        long reviewCount = reviewRepository.countByProductIdAndStatus(productId, ReviewStatus.APPROVED);
        Double averageRating = reviewCount == 0
                ? 0.0
                : roundOneDecimal(reviewRepository.averageRatingByProductIdAndStatus(productId, ReviewStatus.APPROVED));
        EffectivePriceResult price = promotionService.getEffectivePrice(product);
        return new ProductResponse(
                productId,
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
                category.getId(),
                category.getName(),
                averageRating,
                reviewCount,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    private ProductSearchSuggestionResponse toSearchSuggestionResponse(Product product) {
        EffectivePriceResult price = promotionService.getEffectivePrice(product);
        return new ProductSearchSuggestionResponse(
                product.getId(),
                product.getName(),
                product.getImageUrl(),
                product.getCategory().getName(),
                price.originalPrice(),
                price.effectivePrice(),
                price.promotionActive(),
                price.discountPercentage(),
                product.getStockQuantity()
        );
    }

    private Double roundOneDecimal(Double value) {
        if (value == null) {
            return 0.0;
        }
        return Math.round(value * 10.0) / 10.0;
    }
}
