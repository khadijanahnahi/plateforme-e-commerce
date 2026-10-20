package com.boutique.ecommerce.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlogTagRequest(@NotBlank @Size(max = 80) String name) {}
