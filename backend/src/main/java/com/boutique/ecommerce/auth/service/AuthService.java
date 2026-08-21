package com.boutique.ecommerce.auth.service;

import com.boutique.ecommerce.auth.dto.AuthResponse;
import com.boutique.ecommerce.auth.dto.LoginRequest;
import com.boutique.ecommerce.auth.dto.RegisterRequest;
import com.boutique.ecommerce.auth.entity.RefreshTokenSession;
import com.boutique.ecommerce.auth.repository.RefreshTokenSessionRepository;
import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.security.jwt.JwtService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.entity.Role;
import com.boutique.ecommerce.user.entity.RoleName;
import com.boutique.ecommerce.user.repository.RoleRepository;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenSessionRepository refreshTokenSessionRepository;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            RefreshTokenSessionRepository refreshTokenSessionRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenSessionRepository = refreshTokenSessionRepository;
    }

    @Transactional
    public AuthenticatedSession register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResourceConflictException("An account with this email already exists.");
        }

        Role userRole = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new IllegalStateException("Default USER role is missing."));

        AppUser user = AppUser.builder()
                .fullName(request.fullName().trim())
                .email(normalizedEmail)
                .phone(request.phone().trim())
                .password(passwordEncoder.encode(request.password()))
                .enabled(true)
                .roles(Set.of(userRole))
                .build();

        AppUser savedUser = userRepository.save(user);
        UserDetails userDetails = jwtService.toUserDetails(savedUser);
        return buildAuthenticatedSession(savedUser, userDetails);
    }

    @Transactional
    public AuthenticatedSession login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
            );
        } catch (AuthenticationException ex) {
            log.warn("Authentication rejected by Spring Security: {}", ex.getClass().getSimpleName());
            throw new UnauthorizedException("Invalid email or password.");
        }

        AppUser user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("User account not found."));

        return buildAuthenticatedSession(user, (UserDetails) authentication.getPrincipal());
    }

    @Transactional
    public AuthenticatedSession refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Refresh token is required.");
        }

        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new UnauthorizedException("Refresh token is invalid.");
        }

        String tokenHash = hashToken(refreshToken);
        RefreshTokenSession session = refreshTokenSessionRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Refresh session is invalid or revoked."));

        LocalDateTime now = LocalDateTime.now();
        if (!session.isActive(now)) {
            throw new UnauthorizedException("Refresh session has expired or was revoked.");
        }

        String email = jwtService.extractSubject(refreshToken);
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("User account not found."));

        UserDetails userDetails = jwtService.toUserDetails(user);
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new UnauthorizedException("Refresh token has expired or is invalid.");
        }

        session.setRevokedAt(now);
        refreshTokenSessionRepository.save(session);

        return buildAuthenticatedSession(user, userDetails);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        refreshTokenSessionRepository.revokeByTokenHash(hashToken(refreshToken), LocalDateTime.now());
    }

    private AuthenticatedSession buildAuthenticatedSession(AppUser user, UserDetails userDetails) {
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        RefreshTokenSession session = new RefreshTokenSession();
        session.setUser(user);
        session.setTokenHash(hashToken(refreshToken));
        session.setExpiresAt(LocalDateTime.now().plusNanos(jwtService.getRefreshTokenExpirationMs() * 1_000_000));
        refreshTokenSessionRepository.save(session);

        AuthResponse response = new AuthResponse(
                "Bearer",
                jwtService.generateAccessToken(userDetails),
                jwtService.getAccessTokenExpirationMs(),
                new AuthResponse.UserInfo(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getRoles().stream()
                                .map(role -> role.getName().name())
                                .collect(Collectors.toSet())
                )
        );

        return new AuthenticatedSession(response, refreshToken);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm is not available.", ex);
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
