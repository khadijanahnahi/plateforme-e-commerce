package com.boutique.ecommerce.product.controller;

import com.boutique.ecommerce.product.dto.ProductRequest;
import com.boutique.ecommerce.product.dto.ProductResponse;
import com.boutique.ecommerce.product.dto.ProductImportResponse;
import com.boutique.ecommerce.product.dto.UpdateProductStatusRequest;
import com.boutique.ecommerce.product.dto.UpdateProductStockRequest;
import com.boutique.ecommerce.product.service.ProductImportService;
import com.boutique.ecommerce.product.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductService productService;
    private final ProductImportService productImportService;

    public AdminProductController(ProductService productService, ProductImportService productImportService) {
        this.productService = productService;
        this.productImportService = productImportService;
    }

    @GetMapping
    public List<ProductResponse> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId
    ) {
        return productService.getProductsForAdmin(search, categoryId);
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return productService.getByIdForAdmin(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductImportResponse importProducts(
            @RequestPart("catalog") MultipartFile catalog,
            @RequestPart(value = "images", required = false) MultipartFile images,
            @RequestParam(defaultValue = "true") boolean dryRun
    ) {
        return productImportService.importProducts(catalog, images, dryRun);
    }

    @GetMapping(value = "/import/template", produces = "text/csv")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=shopsphere-products-template.csv")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(productImportService.getTemplate());
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PatchMapping("/{id}/stock")
    public ProductResponse updateStock(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductStockRequest request
    ) {
        return productService.updateStock(id, request);
    }

    @PatchMapping("/{id}/status")
    public ProductResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductStatusRequest request
    ) {
        return productService.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    public ProductResponse archive(@PathVariable Long id) {
        return productService.archive(id);
    }

    @DeleteMapping("/{id}/permanent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePermanently(@PathVariable Long id) {
        productService.deletePermanently(id);
    }
}
