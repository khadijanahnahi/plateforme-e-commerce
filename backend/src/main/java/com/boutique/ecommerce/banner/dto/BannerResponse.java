package com.boutique.ecommerce.banner.dto;

import com.boutique.ecommerce.banner.entity.BannerPlacement;
import java.time.LocalDateTime;

public record BannerResponse(
        Long id,
        String title,
        String subtitle,
        String imageUrl,
        String buttonText,
        String targetUrl,
        BannerPlacement placement,
        boolean active,
        Integer priority,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
