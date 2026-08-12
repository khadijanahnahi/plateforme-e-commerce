package com.boutique.ecommerce.cart.service;

import com.boutique.ecommerce.cart.dto.AddCartItemRequest;
import com.boutique.ecommerce.cart.dto.CartItemResponse;
import com.boutique.ecommerce.cart.dto.CartResponse;
import com.boutique.ecommerce.cart.dto.UpdateCartItemRequest;
import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.entity.ProductSize;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.product.entity.ProductVariant;
import com.boutique.ecommerce.product.repository.ProductVariantRepository;
import com.boutique.ecommerce.promotion.service.PromotionService;
import com.boutique.ecommerce.promotion.service.PromotionService.EffectivePriceResult;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PromotionService promotionService;
    private final ProductVariantRepository productVariantRepository;

    public CartService(
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            PromotionService promotionService,
            ProductVariantRepository productVariantRepository
    ) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.promotionService = promotionService;
        this.productVariantRepository = productVariantRepository;
    }

    @Transactional(readOnly = true)
    public CartResponse getCart() {
        AppUser user = getCurrentUser();
        return buildCartResponse(cartItemRepository.findByUserId(user.getId()));
    }

    @Transactional
    public CartResponse addItem(AddCartItemRequest request) {
        AppUser user = getCurrentUser();
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        validateProductCanBeAdded(product);
        ProductVariant variant = resolveVariant(product, request.variantId());

        CartItem cartItem = cartItemRepository.findByUserIdAndVariantId(user.getId(), variant.getId())
                .orElseGet(() -> CartItem.builder()
                        .user(user)
                        .product(product)
                        .variant(variant)
                        .quantity(0)
                        .build());

        int newQuantity = cartItem.getQuantity() + request.quantity();
        validateStock(variant, newQuantity);
        cartItem.setQuantity(newQuantity);
        cartItemRepository.save(cartItem);

        return buildCartResponse(cartItemRepository.findByUserId(user.getId()));
    }

    @Transactional
    public CartResponse updateItem(Long cartItemId, UpdateCartItemRequest request) {
        AppUser user = getCurrentUser();
        CartItem cartItem = cartItemRepository.findByIdAndUserId(cartItemId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found."));

        Product product = cartItem.getProduct();
        validateProductCanBeAdded(product);
        validateStock(cartItem.getVariant(), request.quantity());
        cartItem.setQuantity(request.quantity());

        return buildCartResponse(cartItemRepository.findByUserId(user.getId()));
    }

    @Transactional
    public CartResponse deleteItem(Long cartItemId) {
        AppUser user = getCurrentUser();
        CartItem cartItem = cartItemRepository.findByIdAndUserId(cartItemId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found."));

        cartItemRepository.delete(cartItem);
        return buildCartResponse(cartItemRepository.findByUserId(user.getId()));
    }

    @Transactional
    public CartResponse clearCart() {
        AppUser user = getCurrentUser();
        cartItemRepository.deleteByUserId(user.getId());
        return new CartResponse(List.of(), BigDecimal.ZERO, 0);
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required.");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
    }

    private void validateProductCanBeAdded(Product product) {
        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalArgumentException("Product is not available for cart.");
        }
    }

    private ProductVariant resolveVariant(Product product, Long variantId) {
        if (variantId != null) {
            ProductVariant variant = productVariantRepository.findByIdAndProductId(variantId, product.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found."));
            if (!Boolean.TRUE.equals(variant.getActive())) {
                throw new IllegalArgumentException("Product variant is not available.");
            }
            return variant;
        }

        List<ProductVariant> variants = productVariantRepository.findByProductIdAndActiveTrueOrderById(product.getId());
        if (variants.isEmpty()) {
            return productVariantRepository.save(ProductVariant.builder()
                    .product(product)
                    .size(ProductSize.TAILLE_UNIQUE)
                    .stockQuantity(product.getStockQuantity())
                    .active(true)
                    .build());
        }
        if (variants.size() != 1) {
            throw new IllegalArgumentException("Please select a product size.");
        }
        return variants.get(0);
    }

    private void validateStock(ProductVariant variant, Integer requestedQuantity) {
        if (variant == null || !Boolean.TRUE.equals(variant.getActive())) {
            throw new IllegalArgumentException("Product variant is not available.");
        }
        if (requestedQuantity == null || requestedQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0.");
        }
        if (requestedQuantity > variant.getStockQuantity()) {
            throw new IllegalArgumentException("Insufficient stock for selected size.");
        }
    }

    private CartResponse buildCartResponse(List<CartItem> cartItems) {
        List<CartItemResponse> items = cartItems.stream()
                .map(this::toItemResponse)
                .toList();

        BigDecimal totalAmount = items.stream()
                .map(CartItemResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer totalItems = items.stream()
                .map(CartItemResponse::quantity)
                .reduce(0, Integer::sum);

        return new CartResponse(items, totalAmount, totalItems);
    }

    private CartItemResponse toItemResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();
        EffectivePriceResult price = promotionService.getEffectivePrice(product);
        BigDecimal unitPrice = price.effectivePrice();
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return new CartItemResponse(
                cartItem.getId(),
                product.getId(),
                cartItem.getVariant().getId(),
                cartItem.getVariant().getSize().name(),
                cartItem.getVariant().getSku(),
                product.getName(),
                product.getImageUrl(),
                unitPrice,
                price.originalPrice(),
                price.promotionActive(),
                price.promotionalPrice(),
                price.discountPercentage(),
                price.promotionEndsAt(),
                price.badgeLabel(),
                cartItem.getQuantity(),
                subtotal,
                cartItem.getVariant().getStockQuantity()
        );
    }
}
