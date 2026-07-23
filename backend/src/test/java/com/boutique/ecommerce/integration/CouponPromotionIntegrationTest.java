package com.boutique.ecommerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.coupon.dto.CouponRequest;
import com.boutique.ecommerce.coupon.entity.Coupon;
import com.boutique.ecommerce.coupon.entity.DiscountType;
import com.boutique.ecommerce.coupon.repository.CouponRepository;
import com.boutique.ecommerce.coupon.repository.CouponUsageRepository;
import com.boutique.ecommerce.coupon.service.CouponService;
import com.boutique.ecommerce.order.dto.CreateOrderRequest;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.order.service.OrderService;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.promotion.dto.PromotionRequest;
import com.boutique.ecommerce.promotion.entity.PromotionStatus;
import com.boutique.ecommerce.promotion.entity.PromotionType;
import com.boutique.ecommerce.promotion.service.PromotionService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
class CouponPromotionIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private CouponService couponService;
    @Autowired private CouponRepository couponRepository;
    @Autowired private CouponUsageRepository couponUsageRepository;
    @Autowired private PromotionService promotionService;
    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;

    private AppUser customer;
    private Product product;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString();
        customer = userRepository.save(AppUser.builder()
                .fullName("Coupon Customer")
                .email("coupon-" + suffix + "@example.com")
                .phone("+212600000002")
                .password("not-used")
                .enabled(true)
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Promotion " + suffix)
                .active(true)
                .build());
        product = productRepository.save(Product.builder()
                .name("Promotion product")
                .description("Real PostgreSQL promotion test")
                .price(new BigDecimal("200.00"))
                .stockQuantity(12)
                .sku("PROMO-" + suffix)
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build());
    }

    @Test
    void percentageCouponHonorsMinimumAndMaximumDiscount() {
        createCoupon("SAVE20", DiscountType.PERCENTAGE, "20.00", "100.00", "30.00", null, null,
                LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusDays(1));

        CouponService.CouponCalculation calculation =
                couponService.calculateDiscount("save20", new BigDecimal("200.00"), customer);

        assertThat(calculation.discountAmount()).isEqualByComparingTo("30.00");
        assertThatThrownBy(() -> couponService.calculateDiscount("SAVE20", new BigDecimal("80.00"), customer))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Minimum order amount");
    }

    @Test
    void fixedCouponNeverExceedsSubtotal() {
        createCoupon("FIXED50", DiscountType.FIXED_AMOUNT, "50.00", null, null, null, null,
                null, LocalDateTime.now().plusDays(1));

        assertThat(couponService.calculateDiscount("FIXED50", new BigDecimal("35.00"), customer).discountAmount())
                .isEqualByComparingTo("35.00");
    }

    @Test
    void expiredAndExhaustedCouponsAreRejected() {
        createCoupon("EXPIRED", DiscountType.FIXED_AMOUNT, "10.00", null, null, null, null,
                LocalDateTime.now().minusDays(2), LocalDateTime.now().minusDays(1));
        Coupon exhausted = createCoupon("ONCE", DiscountType.FIXED_AMOUNT, "10.00", null, null, 1, null,
                null, LocalDateTime.now().plusDays(1));
        exhausted.setUsedCount(1);
        couponRepository.flush();

        assertThatThrownBy(() -> couponService.calculateDiscount("EXPIRED", new BigDecimal("100.00"), customer))
                .hasMessageContaining("expired");
        assertThatThrownBy(() -> couponService.calculateDiscount("ONCE", new BigDecimal("100.00"), customer))
                .hasMessageContaining("usage limit");
    }

    @Test
    void publicListingOnlyReturnsVisibleCurrentlyUsableCoupons() {
        Coupon visible = createCoupon("PUBLIC10", DiscountType.PERCENTAGE, "10.00", "100.00", null,
                20, 1, LocalDateTime.now().minusHours(1), LocalDateTime.now().plusDays(2));
        visible.setPubliclyVisible(true);

        Coupon privateCoupon = createCoupon("PRIVATE10", DiscountType.PERCENTAGE, "10.00", null, null,
                null, null, null, LocalDateTime.now().plusDays(2));
        privateCoupon.setPubliclyVisible(false);

        Coupon expired = createCoupon("OLD10", DiscountType.PERCENTAGE, "10.00", null, null,
                null, null, LocalDateTime.now().minusDays(2), LocalDateTime.now().minusDays(1));
        expired.setPubliclyVisible(true);
        couponRepository.flush();

        assertThat(couponService.getActivePublicCoupons())
                .extracting(coupon -> coupon.code())
                .containsExactly("PUBLIC10");
    }

    @Test
    void activePromotionChangesEffectivePriceAndExpiredPromotionDoesNot() {
        promotionService.create(new PromotionRequest(
                product.getId(), "Flash test", null, PromotionType.FLASH_SALE, new BigDecimal("125.00"),
                LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusHours(1),
                PromotionStatus.ACTIVE, 1, "FLASH SALE"));

        PromotionService.EffectivePriceResult active = promotionService.getEffectivePrice(product);
        assertThat(active.promotionActive()).isTrue();
        assertThat(active.originalPrice()).isEqualByComparingTo("200.00");
        assertThat(active.effectivePrice()).isEqualByComparingTo("125.00");
        assertThat(active.discountAmount()).isEqualByComparingTo("75.00");

        product.setStockQuantity(0);
        productRepository.flush();
        assertThat(promotionService.getEffectivePrice(product).promotionActive()).isFalse();
    }

    @Test
    void orderUsesServerSidePromotionAndCouponAndSnapshotsTheEffectivePrice() {
        promotionService.create(new PromotionRequest(
                product.getId(), "Order flash", null, PromotionType.FLASH_SALE, new BigDecimal("125.00"),
                LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusHours(1),
                PromotionStatus.ACTIVE, 1, "FLASH SALE"));
        Coupon coupon = createCoupon("ORDER25", DiscountType.FIXED_AMOUNT, "25.00", null, null,
                10, 1, null, LocalDateTime.now().plusDays(1));
        cartItemRepository.save(CartItem.builder()
                .user(customer)
                .product(product)
                .quantity(2)
                .build());
        authenticate(customer);

        var response = orderService.createOrder(new CreateOrderRequest(
                customer.getFullName(), customer.getPhone(), "10 Test Street", "Fes", "30000",
                null, null, "ORDER25"));
        Order order = orderRepository.findById(response.id()).orElseThrow();

        assertThat(order.getSubtotalAmount()).isEqualByComparingTo("250.00");
        assertThat(order.getDiscountAmount()).isEqualByComparingTo("25.00");
        assertThat(order.getTotalAmount()).isEqualByComparingTo("225.00");
        assertThat(order.getCouponCode()).isEqualTo("ORDER25");
        assertThat(order.getItems()).singleElement().satisfies(item -> {
            assertThat(item.getUnitPrice()).isEqualByComparingTo("125.00");
            assertThat(item.getOriginalPrice()).isEqualByComparingTo("200.00");
            assertThat(item.getDiscountAmount()).isEqualByComparingTo("75.00");
            assertThat(item.getPromotionTitle()).isEqualTo("Order flash");
            assertThat(item.getSubtotal()).isEqualByComparingTo("250.00");
        });
        assertThat(couponUsageRepository.countByCouponIdAndUserId(coupon.getId(), customer.getId()))
                .isEqualTo(1);
    }

    private Coupon createCoupon(
            String code,
            DiscountType type,
            String value,
            String minimum,
            String maximum,
            Integer usageLimit,
            Integer perUserLimit,
            LocalDateTime startsAt,
            LocalDateTime expiresAt
    ) {
        couponService.create(new CouponRequest(
                code,
                code + " coupon",
                null,
                type,
                new BigDecimal(value),
                minimum == null ? null : new BigDecimal(minimum),
                maximum == null ? null : new BigDecimal(maximum),
                usageLimit,
                perUserLimit,
                true,
                startsAt,
                expiresAt,
                false
        ));
        return couponRepository.findByCodeIgnoreCase(code).orElseThrow();
    }

    private void authenticate(AppUser user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of()));
    }
}
