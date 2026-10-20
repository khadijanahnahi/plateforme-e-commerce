package com.boutique.ecommerce.support.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupportMessageRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 150, message = "Full name must not exceed 150 characters.")
        String fullName,

        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be valid.")
        @Size(max = 190, message = "Email must not exceed 190 characters.")
        String email,

        @NotBlank(message = "Subject is required.")
        @Size(max = 160, message = "Subject must not exceed 160 characters.")
        String subject,

        @Size(max = 80, message = "Order number must not exceed 80 characters.")
        String orderNumber,

        @NotBlank(message = "Message is required.")
        @Size(min = 10, max = 5000, message = "Message must be between 10 and 5000 characters.")
        String message
) {
}
