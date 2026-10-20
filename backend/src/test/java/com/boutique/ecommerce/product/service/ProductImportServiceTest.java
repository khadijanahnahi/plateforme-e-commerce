package com.boutique.ecommerce.product.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.product.dto.ProductImportResponse;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.upload.service.UploadService;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class ProductImportServiceTest {

    private CategoryRepository categoryRepository;
    private ProductRepository productRepository;
    private ProductImportService importService;

    @BeforeEach
    void setUp() {
        categoryRepository = mock(CategoryRepository.class);
        productRepository = mock(ProductRepository.class);
        ProductService productService = mock(ProductService.class);
        UploadService uploadService = mock(UploadService.class);
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        importService = new ProductImportService(
                categoryRepository, productRepository, productService, uploadService, validator
        );

        Category category = Category.builder().id(7L).name("T-shirts").active(true).build();
        when(categoryRepository.findByNameIgnoreCase("T-shirts")).thenReturn(Optional.of(category));
    }

    @Test
    void dryRunAcceptsAValidProductWithHttpsImage() {
        MockMultipartFile catalog = csv("""
                name,description,price,sku,status,category,audience,image,stock
                T-shirt noir,Coton premium,249.90,TSHIRT-001,DRAFT,T-shirts,UNISEXE,https://cdn.example.com/tshirt.webp,12
                """);

        ProductImportResponse response = importService.importProducts(catalog, null, true);

        assertThat(response.totalRows()).isEqualTo(1);
        assertThat(response.validCount()).isEqualTo(1);
        assertThat(response.failedCount()).isZero();
        assertThat(response.rows().get(0).status()).isEqualTo("VALID");
    }

    @Test
    void dryRunReportsMissingZipImageWithoutFailingTheWholeBatch() {
        MockMultipartFile catalog = csv("""
                name,price,sku,category,image,stock
                T-shirt noir,249.90,TSHIRT-002,T-shirts,missing.webp,12
                """);

        ProductImportResponse response = importService.importProducts(catalog, null, true);

        assertThat(response.validCount()).isZero();
        assertThat(response.failedCount()).isEqualTo(1);
        assertThat(response.rows().get(0).status()).isEqualTo("ERROR");
        assertThat(response.rows().get(0).message()).contains("missing.webp");
    }

    @Test
    void rejectsCatalogsLargerThanOneHundredRows() {
        StringBuilder content = new StringBuilder("name,price,sku,category,image,stock\n");
        for (int index = 1; index <= 101; index++) {
            content.append("Produit ").append(index)
                    .append(",10.00,SKU-").append(index)
                    .append(",T-shirts,https://cdn.example.com/").append(index).append(".webp,1\n");
        }

        assertThatThrownBy(() -> importService.importProducts(csv(content.toString()), null, true))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("100 produits");
    }

    private MockMultipartFile csv(String content) {
        return new MockMultipartFile(
                "catalog", "catalog.csv", "text/csv", content.getBytes(StandardCharsets.UTF_8)
        );
    }
}
