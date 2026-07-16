package com.boutique.ecommerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.review.dto.ReviewRequest;
import com.boutique.ecommerce.review.dto.ReviewResponse;
import com.boutique.ecommerce.review.entity.ReviewStatus;
import com.boutique.ecommerce.review.service.ProductReviewService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
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
class ProductReviewIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private ProductReviewService reviewService;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private OrderRepository orderRepository;

    private AppUser customer;
    private Product product;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString();
        customer = userRepository.save(AppUser.builder()
                .fullName("Khadija Review")
                .email("review-" + suffix + "@example.com")
                .phone("+212600000005")
                .password("not-used")
                .enabled(true)
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Review " + suffix)
                .active(true)
                .build());
        product = productRepository.save(Product.builder()
                .name("Reviewed product")
                .description("Review integration product")
                .price(new BigDecimal("149.00"))
                .stockQuantity(5)
                .sku("REVIEW-" + suffix)
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customer.getEmail(), null, List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deliveredAndPaidPurchaseCreatesOnePendingVerifiedReview() {
        createOrder(OrderStatus.DELIVERED, PaymentStatus.PAID);

        ReviewResponse review = reviewService.create(product.getId(), new ReviewRequest(5, "Excellent produit premium."));

        assertThat(review.status()).isEqualTo(ReviewStatus.PENDING);
        assertThat(review.verifiedPurchase()).isTrue();
        assertThat(reviewService.getApprovedReviews(product.getId())).isEmpty();
        assertThatThrownBy(() -> reviewService.create(
                product.getId(), new ReviewRequest(4, "Second avis interdit.")))
                .hasMessageContaining("already reviewed");
    }

    @Test
    void undeliveredOrUnpaidPurchaseCannotBeReviewed() {
        createOrder(OrderStatus.CONFIRMED, PaymentStatus.PAID);
        assertThatThrownBy(() -> reviewService.create(
                product.getId(), new ReviewRequest(4, "Commande non livree.")))
                .hasMessageContaining("delivered and paid");

        orderRepository.deleteAll();
        orderRepository.flush();
        createOrder(OrderStatus.DELIVERED, PaymentStatus.UNPAID);
        assertThatThrownBy(() -> reviewService.create(
                product.getId(), new ReviewRequest(4, "Commande non payee.")))
                .hasMessageContaining("delivered and paid");
    }

    @Test
    void onlyApprovedReviewsAffectPublicListAverageAndCount() {
        createOrder(OrderStatus.DELIVERED, PaymentStatus.PAID);
        ReviewResponse pending = reviewService.create(
                product.getId(), new ReviewRequest(4, "Avis authentique et verifie."));

        assertThat(reviewService.getReviewCount(product.getId())).isZero();
        reviewService.approve(pending.id());

        assertThat(reviewService.getApprovedReviews(product.getId())).singleElement()
                .extracting(ReviewResponse::rating)
                .isEqualTo(4);
        assertThat(reviewService.getReviewCount(product.getId())).isEqualTo(1);
        assertThat(reviewService.getAverageRating(product.getId())).isEqualTo(4.0);
        assertThat(reviewService.getLatestVerifiedReviews(6)).singleElement().satisfies(review -> {
            assertThat(review.customerDisplayName()).isEqualTo("Khadija R.");
            assertThat(review.verifiedPurchase()).isTrue();
        });
    }

    private Order createOrder(OrderStatus status, PaymentStatus paymentStatus) {
        Order order = Order.builder()
                .orderNumber("ORD-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase())
                .user(customer)
                .customerName(customer.getFullName())
                .customerEmail(customer.getEmail())
                .customerPhone(customer.getPhone())
                .subtotalAmount(new BigDecimal("149.00"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("149.00"))
                .status(status)
                .paymentStatus(paymentStatus)
                .shippingAddress("Fes")
                .build();
        order.addItem(OrderItem.fromProduct(product, 1));
        return orderRepository.save(order);
    }
}
