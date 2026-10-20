package com.boutique.ecommerce.common.response;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String message,
        String path,
        Map<String, String> validationErrors
) {
}
