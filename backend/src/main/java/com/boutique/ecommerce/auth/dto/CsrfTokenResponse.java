package com.boutique.ecommerce.auth.dto;

public record CsrfTokenResponse(String headerName, String token) {
}
