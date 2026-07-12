package com.boutique.ecommerce.support.dto;

import jakarta.validation.constraints.Size;

public record UpdateSupportMessageNoteRequest(
        @Size(max = 5000, message = "Admin note must not exceed 5000 characters.")
        String adminNote
) {
}
