package com.boutique.ecommerce.settings.controller;

import com.boutique.ecommerce.settings.dto.PublicStoreSettingsResponse;
import com.boutique.ecommerce.settings.service.StoreSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
public class PublicSettingsController {

    private final StoreSettingsService storeSettingsService;

    public PublicSettingsController(StoreSettingsService storeSettingsService) {
        this.storeSettingsService = storeSettingsService;
    }

    @GetMapping("/public")
    public PublicStoreSettingsResponse getPublicSettings() {
        return storeSettingsService.getPublicSettings();
    }
}
