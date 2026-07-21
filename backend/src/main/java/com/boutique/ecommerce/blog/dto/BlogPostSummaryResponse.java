package com.boutique.ecommerce.blog.dto;

import com.boutique.ecommerce.blog.entity.BlogPostStatus;
import java.time.LocalDateTime;
import java.util.List;

public record BlogPostSummaryResponse(
        Long id,
        String title,
        String slug,
        String excerpt,
        String coverImageUrl,
        String coverImageAlt,
        BlogPostStatus status,
        boolean featured,
        String authorDisplayName,
        BlogCategoryResponse category,
        List<BlogTagResponse> tags,
        int readingTimeMinutes,
        LocalDateTime publishedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
