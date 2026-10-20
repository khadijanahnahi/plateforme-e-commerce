package com.boutique.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Token is required.")
        String token,

        @NotBlank(message = "New password is required.")
        @Size(min = 8, max = 128, message = "Password must contain between 8 and 128 characters.")
        String newPassword,

        @NotBlank(message = "Password confirmation is required.")
        String confirmPassword
) {
}
