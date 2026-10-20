package com.boutique.ecommerce.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlogCategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 1000) String description
) {}
