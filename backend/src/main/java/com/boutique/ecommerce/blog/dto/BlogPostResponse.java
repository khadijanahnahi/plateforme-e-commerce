package com.boutique.ecommerce.blog.dto;

import com.boutique.ecommerce.blog.entity.BlogPostStatus;
import com.boutique.ecommerce.product.dto.ProductResponse;
import java.time.LocalDateTime;
import java.util.List;

public record BlogPostResponse(
        Long id,
        String title,
        String slug,
        String excerpt,
        String contentJson,
        String contentHtml,
        String coverImageKey,
        String coverImageUrl,
        String coverImageAlt,
        BlogPostStatus status,
        boolean featured,
        String authorDisplayName,
        BlogCategoryResponse category,
        List<BlogTagResponse> tags,
        List<ProductResponse> products,
        String seoTitle,
        String metaDescription,
        int readingTimeMinutes,
        LocalDateTime publishedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
