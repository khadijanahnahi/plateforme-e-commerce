package com.boutique.ecommerce.returnrequest.dto;

import com.boutique.ecommerce.returnrequest.entity.ReturnRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateReturnRequestStatus(
        @NotNull(message = "Status is required.")
        ReturnRequestStatus status,

        @Size(max = 1000, message = "Admin note must not exceed 1000 characters.")
        String adminNote
) {
}
