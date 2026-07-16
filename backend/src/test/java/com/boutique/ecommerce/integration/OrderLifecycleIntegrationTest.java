package com.boutique.ecommerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.order.dto.CreateOrderRequest;
import com.boutique.ecommerce.order.dto.OrderResponse;
import com.boutique.ecommerce.order.dto.UpdateOrderStatusRequest;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.order.service.OrderService;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.stock.entity.StockMovement;
import com.boutique.ecommerce.stock.entity.StockMovementType;
import com.boutique.ecommerce.stock.repository.StockMovementRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class OrderLifecycleIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private StockMovementRepository stockMovementRepository;
    @Autowired private EntityManager entityManager;

    private AppUser customer;
    private Product product;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString();
        customer = userRepository.save(AppUser.builder()
                .fullName("Integration Customer")
                .email("customer-" + suffix + "@example.com")
                .phone("+212600000001")
                .password("not-used-in-service-test")
                .enabled(true)
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Category " + suffix)
                .description("Integration test category")
                .active(true)
                .build());
        product = productRepository.save(Product.builder()
                .name("Test product")
                .description("Product used by PostgreSQL integration tests")
                .price(new BigDecimal("125.00"))
                .stockQuantity(10)
                .sku("SKU-" + suffix)
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build());
        cartItemRepository.save(CartItem.builder()
                .user(customer)
                .product(product)
                .quantity(2)
                .build());
        authenticate(customer);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createsOrderSnapshotsItemsDecrementsStockClearsCartAndRecordsMovement() {
        OrderResponse response = orderService.createOrder(validRequest());
        entityManager.flush();
        entityManager.clear();

        Order saved = orderRepository.findById(response.id()).orElseThrow();
        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        List<StockMovement> movements = stockMovementRepository.findAll();

        assertThat(saved.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(saved.getPaymentStatus()).isEqualTo(PaymentStatus.UNPAID);
        assertThat(saved.getItems()).singleElement().satisfies(item -> {
            assertThat(item.getProductName()).isEqualTo("Test product");
            assertThat(item.getUnitPrice()).isEqualByComparingTo("125.00");
            assertThat(item.getQuantity()).isEqualTo(2);
            assertThat(item.getSubtotal()).isEqualByComparingTo("250.00");
        });
        assertThat(updatedProduct.getStockQuantity()).isEqualTo(8);
        assertThat(cartItemRepository.findByUserId(customer.getId())).isEmpty();
        assertThat(movements).singleElement().satisfies(movement -> {
            assertThat(movement.getMovementType()).isEqualTo(StockMovementType.ORDER_CREATED);
            assertThat(movement.getStockBefore()).isEqualTo(10);
            assertThat(movement.getQuantityChange()).isEqualTo(-2);
            assertThat(movement.getStockAfter()).isEqualTo(8);
            assertThat(movement.getOrder().getId()).isEqualTo(saved.getId());
        });
    }

    @Test
    void cancellationRestoresStockOnceAndRecordsTheRestoration() {
        OrderResponse created = orderService.createOrder(validRequest());

        orderService.updateStatus(created.id(), new UpdateOrderStatusRequest(OrderStatus.CANCELLED));
        entityManager.flush();
        entityManager.clear();

        Product restoredProduct = productRepository.findById(product.getId()).orElseThrow();
        List<StockMovement> movements = stockMovementRepository.findAll();
        assertThat(restoredProduct.getStockQuantity()).isEqualTo(10);
        assertThat(movements).extracting(StockMovement::getMovementType)
                .containsExactlyInAnyOrder(StockMovementType.ORDER_CREATED, StockMovementType.ORDER_CANCELLED);

        assertThatThrownBy(() -> orderService.updateStatus(
                created.id(), new UpdateOrderStatusRequest(OrderStatus.CANCELLED)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already");
        assertThat(productRepository.findById(product.getId()).orElseThrow().getStockQuantity()).isEqualTo(10);
    }

    @Test
    void invalidStatusTransitionIsRejectedWithoutChangingStock() {
        OrderResponse created = orderService.createOrder(validRequest());

        assertThatThrownBy(() -> orderService.updateStatus(
                created.id(), new UpdateOrderStatusRequest(OrderStatus.SHIPPED)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid order status transition");

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStockQuantity()).isEqualTo(8);
        assertThat(orderRepository.findById(created.id()).orElseThrow().getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    private CreateOrderRequest validRequest() {
        return new CreateOrderRequest(
                customer.getFullName(),
                customer.getPhone(),
                "10 Test Street",
                "Fes",
                "30000",
                "Call before delivery",
                null,
                null
        );
    }

    private void authenticate(AppUser user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of()));
    }
}
