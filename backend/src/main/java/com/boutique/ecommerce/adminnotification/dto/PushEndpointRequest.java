package com.boutique.ecommerce.adminnotification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PushEndpointRequest(
        @NotBlank @Size(max = 2048) String endpoint
) {
}
