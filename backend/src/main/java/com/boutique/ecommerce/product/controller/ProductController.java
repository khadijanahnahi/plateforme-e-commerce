package com.boutique.ecommerce.product.controller;

import com.boutique.ecommerce.product.dto.ProductPageResponse;
import com.boutique.ecommerce.product.dto.ProductResponse;
import com.boutique.ecommerce.product.dto.ProductSearchSuggestionResponse;
import com.boutique.ecommerce.product.service.ProductService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ProductPageResponse getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size
    ) {
        return ProductPageResponse.from(productService.getVisibleProductsPage(search, categoryId, page, size));
    }

    @GetMapping("/search-suggestions")
    public List<ProductSearchSuggestionResponse> searchSuggestions(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "6") int limit
    ) {
        return productService.searchSuggestions(query, limit);
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return productService.getVisibleById(id);
    }
}
