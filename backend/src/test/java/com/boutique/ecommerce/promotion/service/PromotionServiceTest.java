package com.boutique.ecommerce.promotion.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.promotion.dto.PromotionProductResponse;
import com.boutique.ecommerce.promotion.dto.PromotionRequest;
import com.boutique.ecommerce.promotion.entity.Promotion;
import com.boutique.ecommerce.promotion.entity.PromotionStatus;
import com.boutique.ecommerce.promotion.entity.PromotionType;
import com.boutique.ecommerce.promotion.repository.PromotionRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PromotionServiceTest {

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private ProductRepository productRepository;

    private PromotionService promotionService;

    @BeforeEach
    void setUp() {
        promotionService = new PromotionService(promotionRepository, productRepository);
    }

    @Test
    void getEffectivePriceUsesPromotionalPriceWhenPromotionIsActive() {
        Product product = product();
        Promotion promotion = promotion(product);

        when(promotionRepository.findActivePromotionsForProduct(eq(product.getId()), any(LocalDateTime.class)))
                .thenReturn(List.of(promotion));

        PromotionService.EffectivePriceResult result = promotionService.getEffectivePrice(product);

        assertThat(result.promotionActive()).isTrue();
        assertThat(result.originalPrice()).isEqualByComparingTo("200.00");
        assertThat(result.effectivePrice()).isEqualByComparingTo("150.00");
        assertThat(result.discountAmount()).isEqualByComparingTo("50.00");
        assertThat(result.badgeLabel()).isEqualTo("FLASH SALE");
    }

    @Test
    void getEffectivePriceUsesProductPriceWhenNoValidPromotionExists() {
        Product product = product();

        when(promotionRepository.findActivePromotionsForProduct(eq(product.getId()), any(LocalDateTime.class)))
                .thenReturn(List.of());

        PromotionService.EffectivePriceResult result = promotionService.getEffectivePrice(product);

        assertThat(result.promotionActive()).isFalse();
        assertThat(result.originalPrice()).isEqualByComparingTo("200.00");
        assertThat(result.effectivePrice()).isEqualByComparingTo("200.00");
        assertThat(result.promotionalPrice()).isNull();
    }

    @Test
    void createRejectsPromotionalPriceGreaterThanOrEqualToProductPrice() {
        Product product = product();
        PromotionRequest request = request(new BigDecimal("200.00"), PromotionStatus.ACTIVE);

        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> promotionService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("lower than product price");
    }

    @Test
    void createRejectsOverlappingActivePromotionForSameProduct() {
        Product product = product();
        PromotionRequest request = request(new BigDecimal("150.00"), PromotionStatus.ACTIVE);

        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(promotionRepository.existsOverlappingActivePromotion(
                eq(product.getId()),
                eq(request.startsAt()),
                eq(request.endsAt()),
                eq(null)
        )).thenReturn(true);

        assertThatThrownBy(() -> promotionService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("overlapping promotion");
    }

    @Test
    void createStoresProductPriceAsOriginalPriceAndCalculatesDiscount() {
        Product product = product();
        PromotionRequest request = request(new BigDecimal("150.00"), PromotionStatus.ACTIVE);
        ArgumentCaptor<Promotion> captor = ArgumentCaptor.forClass(Promotion.class);

        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(promotionRepository.existsOverlappingActivePromotion(
                eq(product.getId()),
                eq(request.startsAt()),
                eq(request.endsAt()),
                eq(null)
        )).thenReturn(false);
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        promotionService.create(request);

        verify(promotionRepository).save(captor.capture());
        Promotion saved = captor.getValue();
        assertThat(saved.getOriginalPrice()).isEqualByComparingTo("200.00");
        assertThat(saved.getPromotionalPrice()).isEqualByComparingTo("150.00");
        assertThat(saved.getDiscountPercentage()).isEqualByComparingTo("25.00");
    }

    @Test
    void flashSaleResponseContainsPromotionFieldsInProductResponse() {
        Product product = product();
        Promotion promotion = promotion(product);

        when(promotionRepository.findActiveFlashSales(any(LocalDateTime.class))).thenReturn(List.of(promotion));

        List<PromotionProductResponse> response = promotionService.getActiveFlashSales();

        assertThat(response).hasSize(1);
        assertThat(response.get(0).product().promotionActive()).isTrue();
        assertThat(response.get(0).product().originalPrice()).isEqualByComparingTo("200.00");
        assertThat(response.get(0).product().effectivePrice()).isEqualByComparingTo("150.00");
        assertThat(response.get(0).product().promotionBadgeLabel()).isEqualTo("FLASH SALE");
    }

    private Product product() {
        Category category = Category.builder()
                .id(1L)
                .name("T-Shirts")
                .active(true)
                .build();

        return Product.builder()
                .id(1L)
                .name("Black Oversize T-Shirt")
                .description("Premium cotton t-shirt.")
                .price(new BigDecimal("200.00"))
                .stockQuantity(10)
                .imageUrl("https://example.com/tshirt.png")
                .sku("TSHIRT-BLK-001")
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build();
    }

    private Promotion promotion(Product product) {
        LocalDateTime now = LocalDateTime.now();
        return Promotion.builder()
                .id(1L)
                .product(product)
                .title("Flash Sale T-Shirt")
                .description("Limited promotion.")
                .promotionType(PromotionType.FLASH_SALE)
                .originalPrice(new BigDecimal("200.00"))
                .promotionalPrice(new BigDecimal("150.00"))
                .discountPercentage(new BigDecimal("25.00"))
                .startsAt(now.minusHours(1))
                .endsAt(now.plusDays(2))
                .status(PromotionStatus.ACTIVE)
                .priority(10)
                .badgeLabel("FLASH SALE")
                .build();
    }

    private PromotionRequest request(BigDecimal promotionalPrice, PromotionStatus status) {
        LocalDateTime now = LocalDateTime.now();
        return new PromotionRequest(
                1L,
                "Flash Sale T-Shirt",
                "Limited promotion.",
                PromotionType.FLASH_SALE,
                promotionalPrice,
                now.minusHours(1),
                now.plusDays(2),
                status,
                10,
                "FLASH SALE"
        );
    }
}
