package com.boutique.ecommerce.category.dto;

import java.time.LocalDateTime;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String imageUrl,
        boolean active,
        long productCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
