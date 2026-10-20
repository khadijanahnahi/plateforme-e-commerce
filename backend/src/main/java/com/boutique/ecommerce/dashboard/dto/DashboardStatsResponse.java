package com.boutique.ecommerce.dashboard.dto;

import java.math.BigDecimal;

public record DashboardStatsResponse(
        long totalProducts,
        long activeProducts,
        long outOfStockProducts,
        long archivedProducts,
        long totalCategories,
        long totalOrders,
        long pendingOrders,
        long confirmedOrders,
        long shippedOrders,
        long deliveredOrders,
        long cancelledOrders,
        long totalUsers,
        BigDecimal totalRevenue
) {
}
