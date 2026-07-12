package com.boutique.ecommerce.support.dto;

import com.boutique.ecommerce.support.entity.SupportMessageStatus;
import java.time.LocalDateTime;

public record SupportMessageResponse(
        Long id,
        String fullName,
        String email,
        String subject,
        String message,
        String orderNumber,
        SupportMessageStatus status,
        String adminNote,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
