package com.boutique.ecommerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.product.dto.UpdateProductStockRequest;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.product.service.ProductService;
import com.boutique.ecommerce.stock.entity.StockMovement;
import com.boutique.ecommerce.stock.entity.StockMovementType;
import com.boutique.ecommerce.stock.repository.StockMovementRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.entity.Role;
import com.boutique.ecommerce.user.entity.RoleName;
import com.boutique.ecommerce.user.repository.RoleRepository;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class StockMovementIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private ProductService productService;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private StockMovementRepository movementRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;

    private AppUser admin;
    private Product product;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString();
        Role adminRole = roleRepository.findByName(RoleName.ADMIN).orElseThrow();
        admin = userRepository.save(AppUser.builder()
                .fullName("Stock Administrator")
                .email("stock-admin-" + suffix + "@example.com")
                .phone("+212600000006")
                .password("not-used")
                .enabled(true)
                .roles(Set.of(adminRole))
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Stock " + suffix)
                .active(true)
                .build());
        product = productRepository.save(Product.builder()
                .name("Stock product")
                .description("Stock movement integration product")
                .price(new BigDecimal("75.00"))
                .stockQuantity(5)
                .sku("STOCK-" + suffix)
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void manualAdjustmentCapturesBeforeChangeAfterAndAdmin() {
        productService.updateStock(product.getId(), new UpdateProductStockRequest(12));
        productRepository.flush();

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStockQuantity()).isEqualTo(12);
        assertThat(movementRepository.findAll()).singleElement().satisfies(movement -> {
            assertThat(movement.getMovementType()).isEqualTo(StockMovementType.MANUAL_ADJUSTMENT);
            assertThat(movement.getStockBefore()).isEqualTo(5);
            assertThat(movement.getQuantityChange()).isEqualTo(7);
            assertThat(movement.getStockAfter()).isEqualTo(12);
            assertThat(movement.getAdmin().getId()).isEqualTo(admin.getId());
            assertThat(movement.getReason()).contains("administrator");
        });
    }

    @Test
    void databaseConstraintPreventsNegativeStock() {
        assertThatThrownBy(() -> {
            productService.updateStock(product.getId(), new UpdateProductStockRequest(-1));
            productRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }
}
