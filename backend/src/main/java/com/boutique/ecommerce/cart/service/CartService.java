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
import com.boutique.ecommerce.product.repository.ProductRepository;
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

    public CartService(
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
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

        CartItem cartItem = cartItemRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .orElseGet(() -> CartItem.builder()
                        .user(user)
                        .product(product)
                        .quantity(0)
                        .build());

        int newQuantity = cartItem.getQuantity() + request.quantity();
        validateStock(product, newQuantity);
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
        validateStock(product, request.quantity());
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

    private void validateStock(Product product, Integer requestedQuantity) {
        if (requestedQuantity == null || requestedQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0.");
        }
        if (requestedQuantity > product.getStockQuantity()) {
            throw new IllegalArgumentException("Insufficient stock for product.");
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
        BigDecimal unitPrice = product.getPrice();
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return new CartItemResponse(
                cartItem.getId(),
                product.getId(),
                product.getName(),
                product.getImageUrl(),
                unitPrice,
                cartItem.getQuantity(),
                subtotal,
                product.getStockQuantity()
        );
    }
}
