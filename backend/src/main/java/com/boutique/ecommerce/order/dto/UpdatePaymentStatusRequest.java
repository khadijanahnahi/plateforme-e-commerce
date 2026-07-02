package com.boutique.ecommerce.order.dto;

import com.boutique.ecommerce.order.entity.PaymentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePaymentStatusRequest(
        @NotNull(message = "Payment status is required.")
        PaymentStatus paymentStatus
) {
}
