package com.boutique.ecommerce.returnrequest.dto;

import com.boutique.ecommerce.returnrequest.entity.ReturnReason;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReturnRequest(
        @NotNull(message = "Order item is required.")
        Long orderItemId,

        @NotNull(message = "Quantity is required.")
        @Min(value = 1, message = "Quantity must be at least 1.")
        @Max(value = 100, message = "Quantity is too large.")
        Integer quantity,

        @NotNull(message = "Return reason is required.")
        ReturnReason reason,

        @NotBlank(message = "Details are required.")
        @Size(min = 10, max = 1000, message = "Details must contain between 10 and 1000 characters.")
        String details
) {
}
