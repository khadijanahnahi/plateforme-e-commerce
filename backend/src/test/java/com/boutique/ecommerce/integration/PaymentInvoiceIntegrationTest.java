package com.boutique.ecommerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.invoice.dto.InvoiceResponse;
import com.boutique.ecommerce.invoice.repository.InvoiceRepository;
import com.boutique.ecommerce.invoice.service.InvoiceService;
import com.boutique.ecommerce.order.dto.CreateOrderRequest;
import com.boutique.ecommerce.order.dto.OrderResponse;
import com.boutique.ecommerce.order.dto.UpdateOrderStatusRequest;
import com.boutique.ecommerce.order.dto.UpdatePaymentStatusRequest;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.service.OrderService;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.security.jwt.JwtService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
class PaymentInvoiceIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private OrderService orderService;
    @Autowired private InvoiceService invoiceService;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private JwtService jwtService;
    @Autowired private MockMvc mockMvc;

    private AppUser customer;
    private Product product;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString();
        customer = userRepository.save(AppUser.builder()
                .fullName("Invoice Customer")
                .email("invoice-" + suffix + "@example.com")
                .phone("+212600000003")
                .password("not-used")
                .enabled(true)
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Invoice " + suffix)
                .active(true)
                .build());
        product = productRepository.save(Product.builder()
                .name("Invoice product")
                .description("Invoice integration product")
                .price(new BigDecimal("89.00"))
                .stockQuantity(8)
                .sku("INV-" + suffix)
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build());
        authenticate();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void paidTransitionCreatesOneFinalInvoiceAfterCommit() {
        OrderResponse order = createOrder();
        assertThat(order.paymentStatus()).isEqualTo(PaymentStatus.UNPAID);
        assertThat(invoiceRepository.existsByOrderId(order.id())).isFalse();

        orderService.updatePaymentStatus(order.id(), new UpdatePaymentStatusRequest(PaymentStatus.PAID));
        assertThat(invoiceRepository.existsByOrderId(order.id())).isTrue();

        InvoiceResponse first = invoiceService.getInvoiceForCustomer(order.id());
        InvoiceResponse second = invoiceService.createInvoiceForPaidOrder(order.id());
        assertThat(first.invoiceNumber()).isEqualTo(second.invoiceNumber());
        assertThat(first.totalAmount()).isEqualByComparingTo("89.00");
        assertThat(first.items()).singleElement().satisfies(item -> {
            assertThat(item.productName()).isEqualTo("Invoice product");
            assertThat(item.quantity()).isEqualTo(1);
            assertThat(item.unitPrice()).isEqualByComparingTo("89.00");
        });
        assertThat(invoiceRepository.count()).isEqualTo(1);
    }

    @Test
    void cancelledOrderCannotBeMarkedPaidOrInvoiced() {
        OrderResponse order = createOrder();
        orderService.updateStatus(order.id(), new UpdateOrderStatusRequest(OrderStatus.CANCELLED));

        assertThatThrownBy(() -> orderService.updatePaymentStatus(
                order.id(), new UpdatePaymentStatusRequest(PaymentStatus.PAID)))
                .hasMessageContaining("cancelled");
        assertThatThrownBy(() -> invoiceService.createInvoiceForPaidOrder(order.id()))
                .hasMessageContaining("cancelled");
        assertThat(invoiceRepository.existsByOrderId(order.id())).isFalse();
    }

    @Test
    void customerDownloadReturnsNonEmptyPdfWithAttachmentHeaders() throws Exception {
        OrderResponse order = createOrder();
        orderService.updatePaymentStatus(order.id(), new UpdatePaymentStatusRequest(PaymentStatus.PAID));

        MvcResult result = mockMvc.perform(get("/api/orders/{id}/invoice", order.id())
                        .header(HttpHeaders.AUTHORIZATION, bearer()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString(".pdf")))
                .andReturn();

        byte[] pdf = result.getResponse().getContentAsByteArray();
        assertThat(pdf.length).isGreaterThan(500);
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    private OrderResponse createOrder() {
        cartItemRepository.save(CartItem.builder()
                .user(customer)
                .product(product)
                .quantity(1)
                .build());
        return orderService.createOrder(new CreateOrderRequest(
                customer.getFullName(),
                customer.getPhone(),
                "22 Invoice Street",
                "Fes",
                "30000",
                null,
                null,
                null
        ));
    }

    private void authenticate() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(customer.getEmail(), null, List.of()));
    }

    private String bearer() {
        return "Bearer " + jwtService.generateAccessToken(jwtService.toUserDetails(customer));
    }
}
