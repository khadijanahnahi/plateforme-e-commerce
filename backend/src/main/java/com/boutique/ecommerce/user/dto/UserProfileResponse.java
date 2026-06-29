package com.boutique.ecommerce.user.dto;

import java.util.Set;

public record UserProfileResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Set<String> roles
) {
}
