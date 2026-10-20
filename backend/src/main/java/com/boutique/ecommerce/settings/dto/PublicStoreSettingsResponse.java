package com.boutique.ecommerce.settings.dto;

import java.math.BigDecimal;

public record PublicStoreSettingsResponse(
        String storeName,
        String supportEmail,
        String supportPhone,
        String storeAddress,
        String currency,
        BigDecimal deliveryFee,
        BigDecimal freeDeliveryThreshold,
        String estimatedDeliveryText,
        boolean cashOnDeliveryEnabled
) {
}
