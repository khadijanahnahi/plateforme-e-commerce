package com.boutique.ecommerce.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 120, message = "Full name must not exceed 120 characters.")
        String fullName,

        @NotBlank(message = "Email is required.")
        @Email(message = "Email format is invalid.")
        String email,

        @NotBlank(message = "Phone is required.")
        @Pattern(
                regexp = "^[+0-9()\\-\\s]{8,20}$",
                message = "Phone number format is invalid."
        )
        String phone,

        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 100, message = "Password must contain between 8 and 100 characters.")
        String password
) {
}
