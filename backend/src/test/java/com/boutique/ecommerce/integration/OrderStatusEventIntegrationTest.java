package com.boutique.ecommerce.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.order.dto.CreateOrderRequest;
import com.boutique.ecommerce.order.dto.UpdateOrderStatusRequest;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.order.service.OrderService;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
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

class OrderStatusEventIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CartItemRepository cartItemRepository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void statusChangeCommitsBeforeTheAfterCommitEmailListenerReloadsTheOrder() {
        String suffix = UUID.randomUUID().toString();
        AppUser customer = userRepository.save(AppUser.builder()
                .fullName("Status Event Customer")
                .email("status-event-" + suffix + "@example.com")
                .phone("+212600000010")
                .password("not-used")
                .enabled(true)
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Status event " + suffix)
                .active(true)
                .build());
        Product product = productRepository.save(Product.builder()
                .name("Status event product")
                .description("Verifies AFTER_COMMIT listener transaction boundaries")
                .price(new BigDecimal("149.90"))
                .stockQuantity(5)
                .sku("STATUS-EVENT-" + suffix)
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build());
        cartItemRepository.save(cartItemFor(customer, product, 1));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customer.getEmail(), null, List.of()));

        var created = orderService.createOrder(new CreateOrderRequest(
                customer.getFullName(), customer.getPhone(), "10 Test Street", "Fes", "30000",
                null, null, null));
        var updated = orderService.updateStatus(
                created.id(), new UpdateOrderStatusRequest(OrderStatus.CONFIRMED));

        assertThat(updated.status()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(orderRepository.findById(created.id()).orElseThrow().getStatus())
                .isEqualTo(OrderStatus.CONFIRMED);
    }
}
