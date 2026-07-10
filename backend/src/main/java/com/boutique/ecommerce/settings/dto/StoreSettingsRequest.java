package com.boutique.ecommerce.settings.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record StoreSettingsRequest(
        @NotBlank(message = "Store name is required.")
        @Size(max = 120, message = "Store name must not exceed 120 characters.")
        String storeName,

        @NotBlank(message = "Support email is required.")
        @Email(message = "Support email must be valid.")
        @Size(max = 190, message = "Support email must not exceed 190 characters.")
        String supportEmail,

        @Size(max = 40, message = "Support phone must not exceed 40 characters.")
        String supportPhone,

        @Size(max = 1000, message = "Store address must not exceed 1000 characters.")
        String storeAddress,

        @NotBlank(message = "Currency is required.")
        @Pattern(regexp = "[A-Za-z]{3}", message = "Currency must be a three-letter ISO code.")
        String currency,

        @NotNull(message = "Delivery fee is required.")
        @DecimalMin(value = "0.00", message = "Delivery fee must be greater than or equal to zero.")
        BigDecimal deliveryFee,

        @NotNull(message = "Free delivery threshold is required.")
        @DecimalMin(value = "0.00", message = "Free delivery threshold must be greater than or equal to zero.")
        BigDecimal freeDeliveryThreshold,

        @NotBlank(message = "Estimated delivery text is required.")
        @Size(max = 240, message = "Estimated delivery text must not exceed 240 characters.")
        String estimatedDeliveryText,

        @NotNull(message = "Cash on delivery setting is required.")
        Boolean cashOnDeliveryEnabled,

        @NotNull(message = "Email notifications setting is required.")
        Boolean emailNotificationsEnabled,

        @NotNull(message = "Order confirmation email setting is required.")
        Boolean orderConfirmationEmailEnabled,

        @NotNull(message = "Order status email setting is required.")
        Boolean orderStatusEmailEnabled,

        @NotNull(message = "Invoice email setting is required.")
        Boolean invoiceEmailEnabled,

        @NotNull(message = "Low stock threshold is required.")
        @Min(value = 0, message = "Low stock threshold must be greater than or equal to zero.")
        Integer lowStockThreshold,

        @NotBlank(message = "Invoice prefix is required.")
        @Pattern(regexp = "[A-Za-z0-9_-]{1,20}", message = "Invoice prefix may contain letters, numbers, hyphens and underscores only.")
        String invoicePrefix,

        @Size(max = 500, message = "Invoice footer note must not exceed 500 characters.")
        String invoiceFooterNote
) {
}
