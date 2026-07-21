package com.boutique.ecommerce.blog.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record BlogScheduleRequest(@NotNull @Future LocalDateTime publishedAt) {}
