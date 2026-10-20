package com.boutique.ecommerce.banner.dto;

import com.boutique.ecommerce.banner.entity.BannerPlacement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record BannerRequest(
        @NotBlank(message = "Banner title is required.")
        @Size(max = 160, message = "Banner title must not exceed 160 characters.")
        String title,

        @Size(max = 1000, message = "Banner subtitle must not exceed 1000 characters.")
        String subtitle,

        @Size(max = 1000, message = "Banner image URL must not exceed 1000 characters.")
        String imageUrl,

        @Size(max = 80, message = "Button text must not exceed 80 characters.")
        String buttonText,

        @Size(max = 500, message = "Target URL must not exceed 500 characters.")
        String targetUrl,

        @NotNull(message = "Banner placement is required.")
        BannerPlacement placement,

        Boolean active,

        Integer priority,

        LocalDateTime startsAt,

        LocalDateTime endsAt
) {
}
