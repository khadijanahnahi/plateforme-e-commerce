package com.boutique.ecommerce.settings.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StoreSettingsResponse(
        Long id,
        String storeName,
        String supportEmail,
        String supportPhone,
        String storeAddress,
        String currency,
        BigDecimal deliveryFee,
        BigDecimal freeDeliveryThreshold,
        String estimatedDeliveryText,
        boolean cashOnDeliveryEnabled,
        boolean emailNotificationsEnabled,
        boolean orderConfirmationEmailEnabled,
        boolean orderStatusEmailEnabled,
        boolean invoiceEmailEnabled,
        Integer lowStockThreshold,
        String invoicePrefix,
        String invoiceFooterNote,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
