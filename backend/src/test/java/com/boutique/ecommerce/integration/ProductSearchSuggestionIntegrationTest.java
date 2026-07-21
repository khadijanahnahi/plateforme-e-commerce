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
class ProductSearchSuggestionIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private MockMvc mockMvc;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;

    @Test
    void suggestionsAreRelevantLimitedPublicAndLightweight() throws Exception {
        String marker = UUID.randomUUID().toString().replace("-", "");
        Category category = categoryRepository.save(Category.builder()
                .name("Accessoires " + marker)
                .description("Catégorie du test prédictif")
                .active(true)
                .build());

        for (int index = 0; index < 11; index++) {
            productRepository.save(product(
                    index == 0 ? "Pince" : "Pince " + marker + " " + index,
                    "SEARCH-" + marker + "-" + index,
                    ProductStatus.ACTIVE,
                    category
            ));
        }
        productRepository.save(product(
                "Pince archivée " + marker,
                "SEARCH-ARCHIVED-" + marker,
                ProductStatus.ARCHIVED,
                category
        ));

        mockMvc.perform(get("/api/products/search-suggestions")
                        .param("query", "pInCe")
                        .param("limit", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(10))
                .andExpect(jsonPath("$[0].name").value("Pince"))
                .andExpect(jsonPath("$[0].id").isNumber())
                .andExpect(jsonPath("$[0].categoryName").exists())
                .andExpect(jsonPath("$[0].effectivePrice").isNumber())
                .andExpect(jsonPath("$[0].description").doesNotExist())
                .andExpect(jsonPath("$[0].sku").doesNotExist())
                .andExpect(jsonPath("$[0].status").doesNotExist());

        mockMvc.perform(get("/api/products/search-suggestions").param("query", "p"))
                .andExpect(status().isBadRequest());
    }

    private Product product(String name, String sku, ProductStatus status, Category category) {
        return Product.builder()
                .name(name)
                .description("Description non exposée")
                .price(new BigDecimal("49.90"))
                .stockQuantity(4)
                .sku(sku)
                .status(status)
                .category(category)
                .build();
    }
}
