package com.boutique.ecommerce.auth.dto;

import java.util.Set;

public record AuthResponse(
        String tokenType,
        String accessToken,
        long accessTokenExpiresInMs,
        UserInfo user
) {

    public record UserInfo(
            Long id,
            String fullName,
            String email,
            String phone,
            Set<String> roles
    ) {
    }
}
