package com.boutique.ecommerce.settings.controller;

import com.boutique.ecommerce.settings.dto.StoreSettingsRequest;
import com.boutique.ecommerce.settings.dto.StoreSettingsResponse;
import com.boutique.ecommerce.settings.service.StoreSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {

    private final StoreSettingsService storeSettingsService;

    public AdminSettingsController(StoreSettingsService storeSettingsService) {
        this.storeSettingsService = storeSettingsService;
    }

    @GetMapping
    public StoreSettingsResponse getSettings() {
        return storeSettingsService.getSettings();
    }

    @PutMapping
    public StoreSettingsResponse updateSettings(@Valid @RequestBody StoreSettingsRequest request) {
        return storeSettingsService.updateSettings(request);
    }
}
