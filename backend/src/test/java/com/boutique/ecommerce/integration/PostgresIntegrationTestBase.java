package com.boutique.ecommerce.integration;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductSize;
import com.boutique.ecommerce.product.entity.ProductVariant;
import com.boutique.ecommerce.product.repository.ProductVariantRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@ActiveProfiles("integration")
@Testcontainers(disabledWithoutDocker = true)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public abstract class PostgresIntegrationTestBase {

    @Autowired
    protected ProductVariantRepository productVariantRepository;

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("shopsphere_integration")
            .withUsername("shopsphere_test")
            .withPassword("shopsphere_test");

    protected CartItem cartItemFor(AppUser user, Product product, int quantity) {
        ProductVariant variant = productVariantRepository.save(ProductVariant.builder()
                .product(product)
                .size(ProductSize.TAILLE_UNIQUE)
                .sku(product.getSku() == null ? null : product.getSku() + "-UNIQUE")
                .stockQuantity(product.getStockQuantity())
                .active(true)
                .build());
        return CartItem.builder()
                .user(user)
                .product(product)
                .variant(variant)
                .quantity(quantity)
                .build();
    }
}
