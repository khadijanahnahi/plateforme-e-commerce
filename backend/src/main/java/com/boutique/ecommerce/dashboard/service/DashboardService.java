package com.boutique.ecommerce.dashboard.service;

import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.dashboard.dto.DashboardStatsResponse;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public DashboardService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            OrderRepository orderRepository,
            UserRepository userRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        return new DashboardStatsResponse(
                productRepository.count(),
                productRepository.countByStatus(ProductStatus.ACTIVE),
                productRepository.countByStatus(ProductStatus.OUT_OF_STOCK),
                productRepository.countByStatus(ProductStatus.ARCHIVED),
                categoryRepository.count(),
                orderRepository.count(),
                orderRepository.countByStatus(OrderStatus.PENDING),
                orderRepository.countByStatus(OrderStatus.CONFIRMED),
                orderRepository.countByStatus(OrderStatus.SHIPPED),
                orderRepository.countByStatus(OrderStatus.DELIVERED),
                orderRepository.countByStatus(OrderStatus.CANCELLED),
                userRepository.count(),
                orderRepository.sumRevenueExcludingStatus(OrderStatus.CANCELLED).orElse(BigDecimal.ZERO)
        );
    }
}
