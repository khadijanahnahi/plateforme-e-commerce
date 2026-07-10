package com.boutique.ecommerce.settings.entity;

import com.boutique.ecommerce.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "store_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreSettings extends AuditableEntity {

    public static final Long GLOBAL_SETTINGS_ID = 1L;

    @Id
    private Long id;

    @Column(name = "store_name", nullable = false, length = 120)
    private String storeName;

    @Column(name = "support_email", nullable = false, length = 190)
    private String supportEmail;

    @Column(name = "support_phone", length = 40)
    private String supportPhone;

    @Column(name = "store_address", columnDefinition = "text")
    private String storeAddress;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "delivery_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "free_delivery_threshold", nullable = false, precision = 12, scale = 2)
    private BigDecimal freeDeliveryThreshold;

    @Column(name = "estimated_delivery_text", nullable = false, length = 240)
    private String estimatedDeliveryText;

    @Column(name = "cash_on_delivery_enabled", nullable = false)
    private boolean cashOnDeliveryEnabled;

    @Column(name = "email_notifications_enabled", nullable = false)
    private boolean emailNotificationsEnabled;

    @Column(name = "order_confirmation_email_enabled", nullable = false)
    private boolean orderConfirmationEmailEnabled;

    @Column(name = "order_status_email_enabled", nullable = false)
    private boolean orderStatusEmailEnabled;

    @Column(name = "invoice_email_enabled", nullable = false)
    private boolean invoiceEmailEnabled;

    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold;

    @Column(name = "invoice_prefix", nullable = false, length = 20)
    private String invoicePrefix;

    @Column(name = "invoice_footer_note", length = 500)
    private String invoiceFooterNote;
}
