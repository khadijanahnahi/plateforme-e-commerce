package com.boutique.ecommerce.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateOrderRequest(
        @NotBlank(message = "Full name is required.")
        String fullName,

        @NotBlank(message = "Phone number is required.")
        @Pattern(
                regexp = "^[+0-9()\\-\\s]{8,20}$",
                message = "Phone number format is invalid."
        )
        String phoneNumber,

        @NotBlank(message = "Street address is required.")
        String streetAddress,

        @NotBlank(message = "City is required.")
        String city,

        String postalCode,

        String deliveryNotes,

        String shippingAddress
) {
}
