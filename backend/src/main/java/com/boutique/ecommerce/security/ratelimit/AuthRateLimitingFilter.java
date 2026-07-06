package com.boutique.ecommerce.security.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthRateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AuthRateLimitingFilter.class);

    private final AuthRateLimitProperties properties;
    private final ObjectMapper objectMapper;
    private final Map<String, ConcurrentLinkedDeque<Long>> attemptsByKey = new ConcurrentHashMap<>();

    public AuthRateLimitingFilter(AuthRateLimitProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!shouldRateLimit(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        int maxAttempts = Math.max(1, properties.getMaxAttempts());
        int windowSeconds = Math.max(1, properties.getWindowSeconds());
        long now = Instant.now().toEpochMilli();
        long windowStart = now - (windowSeconds * 1000L);
        String key = buildKey(request);
        ConcurrentLinkedDeque<Long> attempts = attemptsByKey.computeIfAbsent(key, ignored -> new ConcurrentLinkedDeque<>());

        pruneOldAttempts(attempts, windowStart);

        if (attempts.size() >= maxAttempts) {
            log.warn("auth rate limit exceeded key={} path={}", key, request.getRequestURI());
            writeRateLimitResponse(response, maxAttempts, windowSeconds);
            return;
        }

        attempts.addLast(now);
        response.setHeader("X-RateLimit-Limit", String.valueOf(maxAttempts));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, maxAttempts - attempts.size())));
        filterChain.doFilter(request, response);
    }

    private boolean shouldRateLimit(HttpServletRequest request) {
        if (!properties.isEnabled() || !"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String path = request.getRequestURI();
        return path.endsWith("/api/auth/login") || path.endsWith("/api/auth/register");
    }

    private String buildKey(HttpServletRequest request) {
        return clientIp(request) + ":" + request.getRequestURI();
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private void pruneOldAttempts(ConcurrentLinkedDeque<Long> attempts, long windowStart) {
        while (true) {
            Long oldest = attempts.peekFirst();
            if (oldest == null || oldest >= windowStart) {
                return;
            }
            attempts.pollFirst();
        }
    }

    private void writeRateLimitResponse(HttpServletResponse response, int maxAttempts, int windowSeconds) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", String.valueOf(windowSeconds));
        response.setHeader("X-RateLimit-Limit", String.valueOf(maxAttempts));
        response.setHeader("X-RateLimit-Remaining", "0");

        objectMapper.writeValue(response.getWriter(), Map.of(
                "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                "message", "Too many authentication attempts. Please try again later.",
                "path", "/api/auth"
        ));
    }
}
