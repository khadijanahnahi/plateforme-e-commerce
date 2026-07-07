package com.boutique.ecommerce.user.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminCustomerResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        boolean active,
        LocalDateTime registeredAt,
        Long orderCount,
        BigDecimal totalSpent
) {
}
