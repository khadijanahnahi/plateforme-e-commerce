package com.boutique.ecommerce.adminnotification.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PushSubscriptionRequest(
        @NotBlank @Size(max = 2048) String endpoint,
        @Valid @NotNull PushSubscriptionKeysRequest keys,
        @Size(max = 120) String deviceName
) {
    public record PushSubscriptionKeysRequest(
            @NotBlank @Size(max = 512) String p256dh,
            @NotBlank @Size(max = 512) String auth
    ) {
    }
}
