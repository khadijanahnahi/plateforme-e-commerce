package com.boutique.ecommerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.order.dto.CreateOrderRequest;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.order.service.OrderService;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.stock.repository.StockMovementRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class OrderRollbackIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private StockMovementRepository stockMovementRepository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rollsBackTheWholeOrderWhenALaterCartItemHasInsufficientStock() {
        String suffix = UUID.randomUUID().toString();
        AppUser customer = userRepository.save(AppUser.builder()
                .fullName("Rollback Customer")
                .email("rollback-" + suffix + "@example.com")
                .phone("+212600000009")
                .password("not-used")
                .enabled(true)
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Rollback " + suffix)
                .active(true)
                .build());
        Product availableProduct = productRepository.save(product(
                category, "Available product", "ROLLBACK-A-" + suffix, 10));
        Product insufficientProduct = productRepository.save(product(
                category, "Insufficient product", "ROLLBACK-B-" + suffix, 1));

        cartItemRepository.save(CartItem.builder()
                .user(customer)
                .product(availableProduct)
                .quantity(2)
                .build());
        cartItemRepository.save(CartItem.builder()
                .user(customer)
                .product(insufficientProduct)
                .quantity(2)
                .build());
        authenticate(customer);

        CreateOrderRequest request = new CreateOrderRequest(
                customer.getFullName(), customer.getPhone(), "10 Test Street", "Fes", "30000",
                null, null, null);

        assertThatThrownBy(() -> orderService.createOrder(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient stock");

        assertThat(orderRepository.findAll()).isEmpty();
        assertThat(stockMovementRepository.findAll()).isEmpty();
        assertThat(cartItemRepository.findByUserId(customer.getId())).hasSize(2);
        assertThat(productRepository.findById(availableProduct.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(10);
        assertThat(productRepository.findById(insufficientProduct.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(1);
    }

    private Product product(Category category, String name, String sku, int stock) {
        return Product.builder()
                .name(name)
                .description("Transactional rollback integration test")
                .price(new BigDecimal("100.00"))
                .stockQuantity(stock)
                .sku(sku)
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build();
    }

    private void authenticate(AppUser user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of()));
    }
}
