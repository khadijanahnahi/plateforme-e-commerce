package com.boutique.ecommerce.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@AutoConfigureMockMvc
class ProductPaginationIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private MockMvc mockMvc;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;

    @Test
    void publicCatalogIsPaginatedFilteredAndSizeLimited() throws Exception {
        String marker = UUID.randomUUID().toString();
        Category category = categoryRepository.save(Category.builder()
                .name("Pagination " + marker)
                .description("Catégorie dédiée au test de pagination")
                .active(true)
                .build());

        for (int index = 0; index < 5; index++) {
            productRepository.save(Product.builder()
                    .name("Produit pagination " + marker + " " + index)
                    .description("Produit visible paginé")
                    .price(new BigDecimal("99.90"))
                    .stockQuantity(10)
                    .sku("PAGE-" + marker + "-" + index)
                    .status(ProductStatus.ACTIVE)
                    .category(category)
                    .build());
        }

        mockMvc.perform(get("/api/products")
                        .param("search", marker)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.content.length()").value(2));

        mockMvc.perform(get("/api/products")
                        .param("search", marker)
                        .param("categoryId", category.getId().toString())
                        .param("page", "2")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number").value(2))
                .andExpect(jsonPath("$.content.length()").value(1));

        mockMvc.perform(get("/api/products").param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(48));
    }
}
