package com.boutique.ecommerce.user.controller;

import com.boutique.ecommerce.auth.dto.AuthResponse;
import com.boutique.ecommerce.user.dto.UpdatePasswordRequest;
import com.boutique.ecommerce.user.dto.UpdateProfileRequest;
import com.boutique.ecommerce.user.dto.UserProfileResponse;
import com.boutique.ecommerce.user.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public UserProfileResponse getProfile() {
        return userProfileService.getProfile();
    }

    @PutMapping
    public AuthResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userProfileService.updateProfile(request);
    }

    @PutMapping("/password")
    public UserProfileResponse updatePassword(@Valid @RequestBody UpdatePasswordRequest request) {
        return userProfileService.updatePassword(request);
    }
}
