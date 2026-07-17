package com.boutique.ecommerce.auth.service;

import com.boutique.ecommerce.auth.dto.AuthResponse;

public record AuthenticatedSession(
        AuthResponse response,
        String refreshToken
) {
}
