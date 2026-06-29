package com.boutique.ecommerce.dashboard.service;

import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.dashboard.dto.DashboardPeriod;
import com.boutique.ecommerce.dashboard.dto.DashboardStatsResponse;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    public DashboardStatsResponse getStats(DashboardPeriod period) {
        LocalDateTime startDate = resolveStartDate(period);

        return new DashboardStatsResponse(
                productRepository.count(),
                productRepository.countByStatus(ProductStatus.ACTIVE),
                productRepository.countByStatus(ProductStatus.OUT_OF_STOCK),
                productRepository.countByStatus(ProductStatus.ARCHIVED),
                categoryRepository.count(),
                countOrders(startDate),
                countOrdersByStatus(OrderStatus.PENDING, startDate),
                countOrdersByStatus(OrderStatus.CONFIRMED, startDate),
                countOrdersByStatus(OrderStatus.SHIPPED, startDate),
                countOrdersByStatus(OrderStatus.DELIVERED, startDate),
                countOrdersByStatus(OrderStatus.CANCELLED, startDate),
                userRepository.count(),
                sumRevenue(startDate)
        );
    }

    private long countOrders(LocalDateTime startDate) {
        return startDate == null
                ? orderRepository.count()
                : orderRepository.countByCreatedAtGreaterThanEqual(startDate);
    }

    private long countOrdersByStatus(OrderStatus status, LocalDateTime startDate) {
        return startDate == null
                ? orderRepository.countByStatus(status)
                : orderRepository.countByStatusAndCreatedAtGreaterThanEqual(status, startDate);
    }

    private BigDecimal sumRevenue(LocalDateTime startDate) {
        return startDate == null
                ? orderRepository.sumRevenueExcludingStatus(OrderStatus.CANCELLED).orElse(BigDecimal.ZERO)
                : orderRepository.sumRevenueExcludingStatusSince(OrderStatus.CANCELLED, startDate).orElse(BigDecimal.ZERO);
    }

    private LocalDateTime resolveStartDate(DashboardPeriod period) {
        DashboardPeriod selectedPeriod = period == null ? DashboardPeriod.ALL : period;
        LocalDate today = LocalDate.now();

        return switch (selectedPeriod) {
            case TODAY -> today.atStartOfDay();
            case WEEK -> today.with(DayOfWeek.MONDAY).atStartOfDay();
            case MONTH -> today.withDayOfMonth(1).atStartOfDay();
            case ALL -> null;
        };
    }
}
