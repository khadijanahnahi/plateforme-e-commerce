package com.boutique.ecommerce.user.service;

import com.boutique.ecommerce.auth.dto.AuthResponse;
import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.security.jwt.JwtService;
import com.boutique.ecommerce.user.dto.UpdatePasswordRequest;
import com.boutique.ecommerce.user.dto.UpdateProfileRequest;
import com.boutique.ecommerce.user.dto.UserProfileResponse;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserProfileService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile() {
        return toProfileResponse(getCurrentUser());
    }

    @Transactional
    public AuthResponse updateProfile(UpdateProfileRequest request) {
        AppUser user = getCurrentUser();
        String normalizedEmail = normalizeEmail(request.email());

        userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(existingUser -> !existingUser.getId().equals(user.getId()))
                .ifPresent(existingUser -> {
                    throw new ResourceConflictException("An account with this email already exists.");
                });

        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(request.phone().trim());

        UserDetails userDetails = jwtService.toUserDetails(user);
        return new AuthResponse(
                "Bearer",
                jwtService.generateAccessToken(userDetails),
                jwtService.generateRefreshToken(userDetails),
                jwtService.getAccessTokenExpirationMs(),
                new AuthResponse.UserInfo(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        roles(user)
                )
        );
    }

    @Transactional
    public UserProfileResponse updatePassword(UpdatePasswordRequest request) {
        AppUser user = getCurrentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        return toProfileResponse(user);
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required.");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
    }

    private UserProfileResponse toProfileResponse(AppUser user) {
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                roles(user)
        );
    }

    private Set<String> roles(AppUser user) {
        return user.getRoles()
                .stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
