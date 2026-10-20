package com.boutique.ecommerce.support.dto;

import com.boutique.ecommerce.support.entity.SupportMessageStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateSupportMessageStatusRequest(
        @NotNull(message = "Status is required.")
        SupportMessageStatus status
) {
}
