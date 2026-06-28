package com.boutique.ecommerce.product.service;

import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.product.dto.ProductRequest;
import com.boutique.ecommerce.product.dto.ProductResponse;
import com.boutique.ecommerce.product.dto.UpdateProductStatusRequest;
import com.boutique.ecommerce.product.dto.UpdateProductStockRequest;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private static final List<ProductStatus> PUBLIC_STATUSES = List.of(
            ProductStatus.ACTIVE,
            ProductStatus.OUT_OF_STOCK
    );

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getVisibleProducts(String search, Long categoryId) {
        String normalizedSearch = normalizeSearch(search);
        List<Product> products = normalizedSearch == null
                ? productRepository.findVisibleProducts(PUBLIC_STATUSES, categoryId)
                : productRepository.searchVisibleProducts(PUBLIC_STATUSES, toSearchPattern(normalizedSearch), categoryId);

        return products
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getVisibleById(Long id) {
        Product product = productRepository.findByIdAndStatusIn(id, PUBLIC_STATUSES)
                .orElseThrow(() -> new ResourceNotFoundException("Visible product not found."));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsForAdmin(String search, Long categoryId) {
        String normalizedSearch = normalizeSearch(search);
        List<Product> products = normalizedSearch == null
                ? productRepository.findProductsForAdmin(categoryId)
                : productRepository.searchProductsForAdmin(toSearchPattern(normalizedSearch), categoryId);

        return products
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getByIdForAdmin(Long id) {
        return toResponse(findProduct(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = findActiveCategory(request.categoryId());
        String sku = normalizeOptional(request.sku());
        validateUniqueSku(sku, null);

        Product product = Product.builder()
                .name(normalizeRequired(request.name()))
                .description(normalizeOptional(request.description()))
                .price(request.price())
                .stockQuantity(request.stockQuantity())
                .imageUrl(normalizeOptional(request.imageUrl()))
                .sku(sku)
                .status(resolveStatus(request.status(), request.stockQuantity()))
                .category(category)
                .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = findProduct(id);
        Category category = findActiveCategory(request.categoryId());
        String sku = normalizeOptional(request.sku());
        validateUniqueSku(sku, id);

        product.setName(normalizeRequired(request.name()));
        product.setDescription(normalizeOptional(request.description()));
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
        product.setImageUrl(normalizeOptional(request.imageUrl()));
        product.setSku(sku);
        product.setStatus(resolveStatus(request.status(), request.stockQuantity()));
        product.setCategory(category);

        return toResponse(product);
    }

    @Transactional
    public ProductResponse updateStock(Long id, UpdateProductStockRequest request) {
        Product product = findProduct(id);
        product.setStockQuantity(request.stockQuantity());

        if (request.stockQuantity() == 0 && product.getStatus() == ProductStatus.ACTIVE) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else if (request.stockQuantity() > 0 && product.getStatus() == ProductStatus.OUT_OF_STOCK) {
            product.setStatus(ProductStatus.ACTIVE);
        }

        return toResponse(product);
    }

    @Transactional
    public ProductResponse updateStatus(Long id, UpdateProductStatusRequest request) {
        Product product = findProduct(id);
        product.setStatus(resolveStatus(request.status(), product.getStockQuantity()));
        return toResponse(product);
    }

    @Transactional
    public ProductResponse archive(Long id) {
        Product product = findProduct(id);
        product.archive();
        return toResponse(product);
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
    }

    private Category findActiveCategory(Long categoryId) {
        return categoryRepository.findByIdAndActiveTrue(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Active category not found."));
    }

    private void validateUniqueSku(String sku, Long currentProductId) {
        if (sku == null) {
            return;
        }

        productRepository.findBySkuIgnoreCase(sku)
                .filter(product -> currentProductId == null || !product.getId().equals(currentProductId))
                .ifPresent(product -> {
                    throw new ResourceConflictException("Product SKU already exists.");
                });
    }

    private ProductStatus resolveStatus(ProductStatus requestedStatus, Integer stockQuantity) {
        ProductStatus status = requestedStatus == null ? ProductStatus.ACTIVE : requestedStatus;
        if (status == ProductStatus.ACTIVE && stockQuantity == 0) {
            return ProductStatus.OUT_OF_STOCK;
        }
        return status;
    }

    private String normalizeSearch(String value) {
        return normalizeOptional(value);
    }

    private String toSearchPattern(String value) {
        return "%" + value.toLowerCase() + "%";
    }

    private String normalizeRequired(String value) {
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private ProductResponse toResponse(Product product) {
        Category category = product.getCategory();
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(),
                product.getImageUrl(),
                product.getSku(),
                product.getStatus(),
                category.getId(),
                category.getName(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
