package com.boutique.ecommerce.product.service;

import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderItemRepository;
import com.boutique.ecommerce.product.dto.BestSellerResponse;
import com.boutique.ecommerce.product.dto.ProductResponse;
import com.boutique.ecommerce.product.entity.ProductStatus;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BestSellerService {

    private static final List<ProductStatus> PUBLIC_STATUSES = List.of(
            ProductStatus.ACTIVE,
            ProductStatus.OUT_OF_STOCK
    );

    private final OrderItemRepository orderItemRepository;
    private final ProductService productService;

    public BestSellerService(OrderItemRepository orderItemRepository, ProductService productService) {
        this.orderItemRepository = orderItemRepository;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public List<BestSellerResponse> getBestSellers(int requestedLimit) {
        int limit = Math.max(1, Math.min(requestedLimit, 20));
        List<OrderItemRepository.BestSellerProjection> sales = orderItemRepository.findBestSellers(
                OrderStatus.DELIVERED,
                PaymentStatus.PAID,
                PUBLIC_STATUSES,
                PageRequest.of(0, limit)
        );

        if (!sales.isEmpty()) {
            return sales.stream()
                    .map(sale -> toResponse(productService.getVisibleById(sale.getProductId()), sale.getQuantitySold()))
                    .toList();
        }

        return productService.getVisibleProducts(null, null).stream()
                .limit(limit)
                .map(product -> toResponse(product, null))
                .toList();
    }

    private BestSellerResponse toResponse(ProductResponse product, Long quantitySold) {
        return new BestSellerResponse(
                product.id(),
                product.name(),
                shorten(product.description()),
                product.imageUrl(),
                product.categoryName(),
                product.originalPrice(),
                product.effectivePrice(),
                product.promotionActive(),
                product.discountPercentage(),
                product.averageRating(),
                product.reviewCount(),
                quantitySold,
                product.stockQuantity()
        );
    }

    private String shorten(String description) {
        if (description == null || description.length() <= 180) {
            return description;
        }
        return description.substring(0, 177).stripTrailing() + "...";
    }
}
