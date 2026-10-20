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
import com.boutique.ecommerce.returnrequest.dto.CreateReturnRequest;
import com.boutique.ecommerce.returnrequest.entity.ReturnReason;
import com.boutique.ecommerce.returnrequest.entity.ReturnRequestStatus;
import com.boutique.ecommerce.returnrequest.repository.ReturnRequestRepository;
import com.boutique.ecommerce.returnrequest.service.ReturnRequestService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

class ReturnRequestIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired
    private ReturnRequestService returnRequestService;

    @Autowired
    private ReturnRequestRepository returnRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @Transactional
    void createsOneReturnRequestForOwnedDeliveredAndPaidItem() {
        TestPurchase purchase = createPurchase("eligible", OrderStatus.DELIVERED, PaymentStatus.PAID);
        authenticate(purchase.user().getEmail());

        assertThat(returnRequestService.getEligibleItems()).hasSize(1);

        var response = returnRequestService.create(new CreateReturnRequest(
                purchase.item().getId(),
                1,
                ReturnReason.NOT_AS_DESCRIBED,
                "La finition reçue ne correspond pas à la présentation du produit."
        ));

        assertThat(response.status()).isEqualTo(ReturnRequestStatus.REQUESTED);
        assertThat(response.orderNumber()).isEqualTo(purchase.order().getOrderNumber());
        assertThat(returnRequestRepository.count()).isEqualTo(1);
        assertThat(returnRequestService.getEligibleItems()).isEmpty();
    }

    @Test
    @Transactional
    void rejectsReturnForUnpaidOrder() {
        TestPurchase purchase = createPurchase("unpaid", OrderStatus.DELIVERED, PaymentStatus.UNPAID);
        authenticate(purchase.user().getEmail());

        assertThat(returnRequestService.getEligibleItems()).isEmpty();
        assertThatThrownBy(() -> returnRequestService.create(new CreateReturnRequest(
                purchase.item().getId(),
                1,
                ReturnReason.OTHER,
                "Je souhaite demander une vérification de cet article."
        )))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("delivered and paid");
    }

    private TestPurchase createPurchase(String suffix, OrderStatus status, PaymentStatus paymentStatus) {
        AppUser user = userRepository.save(AppUser.builder()
                .fullName("Client Return " + suffix)
                .email("return-" + suffix + "@shopsphere.test")
                .phone("+212600000001")
                .password("encoded-password")
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Return Category " + suffix)
                .active(true)
                .build());
        Product product = productRepository.save(Product.builder()
                .name("Return Product " + suffix)
                .sku("RETURN-" + suffix)
                .price(new BigDecimal("249.00"))
                .stockQuantity(5)
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build());
        Order order = Order.builder()
                .orderNumber("ORD-RETURN-" + suffix)
                .user(user)
                .customerName(user.getFullName())
                .customerEmail(user.getEmail())
                .customerPhone(user.getPhone())
                .subtotalAmount(new BigDecimal("498.00"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("498.00"))
                .status(status)
                .paymentStatus(paymentStatus)
                .shippingAddress("Fès, Maroc")
                .build();
        OrderItem item = OrderItem.fromProduct(product, 2);
        order.addItem(item);
        orderRepository.saveAndFlush(order);
        return new TestPurchase(user, order, item);
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(email, null, java.util.List.of())
        );
    }

    private record TestPurchase(AppUser user, Order order, OrderItem item) {
    }
}
