package com.boutique.ecommerce.auth.controller;

import com.boutique.ecommerce.auth.dto.AuthResponse;
import com.boutique.ecommerce.auth.dto.LoginRequest;
import com.boutique.ecommerce.auth.dto.RefreshTokenRequest;
import com.boutique.ecommerce.auth.dto.RegisterRequest;
import com.boutique.ecommerce.auth.service.AuthenticatedSession;
import com.boutique.ecommerce.auth.service.AuthService;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "shopsphere_refresh_token";

    private final AuthService authService;
    private final boolean refreshCookieSecure;
    private final String refreshCookieSameSite;
    private final long refreshCookieMaxAgeMs;

    public AuthController(
            AuthService authService,
            @Value("${app.security.refresh-cookie.secure:false}") boolean refreshCookieSecure,
            @Value("${app.security.refresh-cookie.same-site:Lax}") String refreshCookieSameSite,
            @Value("${jwt.refresh-token-expiration-ms}") long refreshCookieMaxAgeMs
    ) {
        this.authService = authService;
        this.refreshCookieSecure = refreshCookieSecure;
        this.refreshCookieSameSite = refreshCookieSameSite;
        this.refreshCookieMaxAgeMs = refreshCookieMaxAgeMs;
    }

    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        csrfToken.getToken();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthenticatedSession session = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(session.refreshToken()).toString())
                .body(session.response());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthenticatedSession session = authService.login(request);
        return ResponseEntity
                .ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(session.refreshToken()).toString())
                .body(session.response());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshTokenRequest legacyRequest
    ) {
        String refreshToken = cookieRefreshToken != null ? cookieRefreshToken : legacyRequest != null ? legacyRequest.refreshToken() : null;
        AuthenticatedSession session = authService.refreshToken(refreshToken);
        return ResponseEntity
                .ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(session.refreshToken()).toString())
                .body(session.response());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken
    ) {
        authService.logout(refreshToken);
        return ResponseEntity
                .noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    private ResponseCookie buildRefreshCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path("/api/auth")
                .maxAge(Duration.ofMillis(refreshCookieMaxAgeMs))
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .build();
    }
}
