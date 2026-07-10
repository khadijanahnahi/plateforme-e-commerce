package com.boutique.ecommerce.settings.service;

import com.boutique.ecommerce.settings.dto.PublicStoreSettingsResponse;
import com.boutique.ecommerce.settings.dto.StoreSettingsRequest;
import com.boutique.ecommerce.settings.dto.StoreSettingsResponse;
import com.boutique.ecommerce.settings.entity.StoreSettings;
import com.boutique.ecommerce.settings.repository.StoreSettingsRepository;
import java.math.BigDecimal;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StoreSettingsService {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);

    private final StoreSettingsRepository storeSettingsRepository;

    public StoreSettingsService(StoreSettingsRepository storeSettingsRepository) {
        this.storeSettingsRepository = storeSettingsRepository;
    }

    @Transactional
    public StoreSettingsResponse getSettings() {
        return toResponse(getOrCreateSettings());
    }

    @Transactional
    public PublicStoreSettingsResponse getPublicSettings() {
        StoreSettings settings = getOrCreateSettings();
        return new PublicStoreSettingsResponse(
                settings.getStoreName(),
                settings.getSupportEmail(),
                settings.getSupportPhone(),
                settings.getStoreAddress(),
                settings.getCurrency(),
                settings.getDeliveryFee(),
                settings.getFreeDeliveryThreshold(),
                settings.getEstimatedDeliveryText(),
                settings.isCashOnDeliveryEnabled()
        );
    }

    @Transactional
    public StoreSettingsResponse updateSettings(StoreSettingsRequest request) {
        StoreSettings settings = getOrCreateSettings();
        settings.setStoreName(normalizeRequired(request.storeName()));
        settings.setSupportEmail(normalizeRequired(request.supportEmail()).toLowerCase(Locale.ROOT));
        settings.setSupportPhone(normalizeOptional(request.supportPhone()));
        settings.setStoreAddress(normalizeOptional(request.storeAddress()));
        settings.setCurrency(normalizeRequired(request.currency()).toUpperCase(Locale.ROOT));
        settings.setDeliveryFee(request.deliveryFee());
        settings.setFreeDeliveryThreshold(request.freeDeliveryThreshold());
        settings.setEstimatedDeliveryText(normalizeRequired(request.estimatedDeliveryText()));
        settings.setCashOnDeliveryEnabled(request.cashOnDeliveryEnabled());
        settings.setEmailNotificationsEnabled(request.emailNotificationsEnabled());
        settings.setOrderConfirmationEmailEnabled(request.orderConfirmationEmailEnabled());
        settings.setOrderStatusEmailEnabled(request.orderStatusEmailEnabled());
        settings.setInvoiceEmailEnabled(request.invoiceEmailEnabled());
        settings.setLowStockThreshold(request.lowStockThreshold());
        settings.setInvoicePrefix(normalizeRequired(request.invoicePrefix()).toUpperCase(Locale.ROOT));
        settings.setInvoiceFooterNote(normalizeOptional(request.invoiceFooterNote()));
        return toResponse(storeSettingsRepository.saveAndFlush(settings));
    }

    private StoreSettings getOrCreateSettings() {
        return storeSettingsRepository.findById(StoreSettings.GLOBAL_SETTINGS_ID)
                .orElseGet(() -> storeSettingsRepository.save(defaultSettings()));
    }

    private StoreSettings defaultSettings() {
        return StoreSettings.builder()
                .id(StoreSettings.GLOBAL_SETTINGS_ID)
                .storeName("ShopSphere")
                .supportEmail("support@shopsphere.ma")
                .supportPhone("+212 6 00 00 00 00")
                .storeAddress("Fès, Maroc")
                .currency("MAD")
                .deliveryFee(ZERO)
                .freeDeliveryThreshold(ZERO)
                .estimatedDeliveryText("Livraison sous 2 à 5 jours ouvrables.")
                .cashOnDeliveryEnabled(true)
                .emailNotificationsEnabled(true)
                .orderConfirmationEmailEnabled(true)
                .orderStatusEmailEnabled(true)
                .invoiceEmailEnabled(true)
                .lowStockThreshold(5)
                .invoicePrefix("INV")
                .invoiceFooterNote("Merci pour votre achat chez ShopSphere.")
                .build();
    }

    private StoreSettingsResponse toResponse(StoreSettings settings) {
        return new StoreSettingsResponse(
                settings.getId(),
                settings.getStoreName(),
                settings.getSupportEmail(),
                settings.getSupportPhone(),
                settings.getStoreAddress(),
                settings.getCurrency(),
                settings.getDeliveryFee(),
                settings.getFreeDeliveryThreshold(),
                settings.getEstimatedDeliveryText(),
                settings.isCashOnDeliveryEnabled(),
                settings.isEmailNotificationsEnabled(),
                settings.isOrderConfirmationEmailEnabled(),
                settings.isOrderStatusEmailEnabled(),
                settings.isInvoiceEmailEnabled(),
                settings.getLowStockThreshold(),
                settings.getInvoicePrefix(),
                settings.getInvoiceFooterNote(),
                settings.getCreatedAt(),
                settings.getUpdatedAt()
        );
    }

    private String normalizeRequired(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Required store setting is missing.");
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
