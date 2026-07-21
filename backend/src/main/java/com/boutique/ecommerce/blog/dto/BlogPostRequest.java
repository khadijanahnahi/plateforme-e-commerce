package com.boutique.ecommerce.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record BlogPostRequest(
        @NotBlank @Size(max = 220) String title,
        @Size(max = 240) String slug,
        @NotBlank @Size(max = 600) String excerpt,
        @NotBlank @Size(max = 500000) String contentJson,
        @Size(max = 500000) String contentHtml,
        @Size(max = 500) String coverImageKey,
        @Size(max = 2000) String coverImageUrl,
        @Size(max = 220) String coverImageAlt,
        Long categoryId,
        Set<Long> tagIds,
        Set<Long> productIds,
        @Size(max = 220) String seoTitle,
        @Size(max = 320) String metaDescription
) {}
