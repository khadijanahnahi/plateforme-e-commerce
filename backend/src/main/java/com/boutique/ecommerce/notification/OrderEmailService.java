package com.boutique.ecommerce.notification;

import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.settings.entity.StoreSettings;
import com.boutique.ecommerce.settings.repository.StoreSettingsRepository;
import jakarta.mail.MessagingException;
import java.math.BigDecimal;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderEmailService {

    private static final Logger log = LoggerFactory.getLogger(OrderEmailService.class);
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final OrderRepository orderRepository;
    private final EmailService emailService;
    private final AppEmailProperties emailProperties;
    private final StoreSettingsRepository storeSettingsRepository;

    public OrderEmailService(
            OrderRepository orderRepository,
            EmailService emailService,
            AppEmailProperties emailProperties,
            StoreSettingsRepository storeSettingsRepository
    ) {
        this.orderRepository = orderRepository;
        this.emailService = emailService;
        this.emailProperties = emailProperties;
        this.storeSettingsRepository = storeSettingsRepository;
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public void sendOrderConfirmation(Long orderId) {
        if (!isStoreEmailEnabled(true)) {
            log.info("Order confirmation email skipped by store settings. orderId={}", orderId);
            return;
        }
        sendOrderEmail(orderId, "confirmation", order -> new EmailContent(
                "Votre commande " + emailProperties.getStoreName() + " " + order.getOrderNumber(),
                buildOrderConfirmationHtml(order)
        ));
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public void sendOrderStatusUpdate(Long orderId, OrderStatus oldStatus, OrderStatus newStatus) {
        if (!isStoreEmailEnabled(false)) {
            log.info("Order status email skipped by store settings. orderId={} newStatus={}", orderId, newStatus);
            return;
        }
        if (oldStatus == newStatus) {
            log.info(
                    "Order status update email skipped: status did not change. orderId={} status={}",
                    orderId,
                    newStatus
            );
            return;
        }

        if (!isCustomerFacingStatus(newStatus)) {
            log.info(
                    "Order status update email skipped: status does not require email. orderId={} oldStatus={} newStatus={}",
                    orderId,
                    oldStatus,
                    newStatus
            );
            return;
        }

        sendOrderEmail(orderId, "status update", order -> new EmailContent(
                buildStatusSubject(order, newStatus),
                buildOrderStatusHtml(order, newStatus)
        ));
    }

    private void sendOrderEmail(Long orderId, String emailType, OrderEmailContentFactory contentFactory) {
        if (!emailProperties.isEnabled()) {
            log.info("Order {} email skipped: email service is disabled. orderId={}", emailType, orderId);
            return;
        }

        if (!emailService.isConfigured()) {
            log.warn("Order {} email skipped: JavaMailSender is not configured. orderId={}", emailType, orderId);
            return;
        }

        Optional<Order> orderResult = orderRepository.findById(orderId);
        if (orderResult.isEmpty()) {
            log.warn("Order {} email skipped: order not found. orderId={}", emailType, orderId);
            return;
        }

        Order order = orderResult.get();
        if (order.getCustomerEmail() == null || order.getCustomerEmail().isBlank()) {
            log.warn("Order {} email skipped: customer email is empty. orderId={}", emailType, orderId);
            return;
        }

        try {
            EmailContent content = contentFactory.create(order);
            emailService.sendHtml(order.getCustomerEmail(), content.subject(), content.body());
            log.info("Order {} email sent. orderId={} orderNumber={}", emailType, order.getId(), order.getOrderNumber());
        } catch (MessagingException | RuntimeException exception) {
            log.error(
                    "Order {} email failed. orderId={} orderNumber={}",
                    emailType,
                    order.getId(),
                    order.getOrderNumber(),
                    exception
            );
        }
    }

    private boolean isStoreEmailEnabled(boolean confirmationEmail) {
        return storeSettingsRepository.findById(StoreSettings.GLOBAL_SETTINGS_ID)
                .map(settings -> settings.isEmailNotificationsEnabled()
                        && (confirmationEmail
                        ? settings.isOrderConfirmationEmailEnabled()
                        : settings.isOrderStatusEmailEnabled()))
                .orElse(true);
    }

    private boolean isCustomerFacingStatus(OrderStatus status) {
        return status == OrderStatus.CONFIRMED
                || status == OrderStatus.SHIPPED
                || status == OrderStatus.DELIVERED
                || status == OrderStatus.CANCELLED;
    }

    private String buildStatusSubject(Order order, OrderStatus status) {
        return switch (status) {
            case CONFIRMED -> "Votre commande " + order.getOrderNumber() + " est confirmée";
            case SHIPPED -> "Votre commande " + order.getOrderNumber() + " a été expédiée";
            case DELIVERED -> "Votre commande " + order.getOrderNumber() + " est livrée";
            case CANCELLED -> "Votre commande " + order.getOrderNumber() + " est annulée";
            case PENDING -> "Mise à jour de votre commande " + order.getOrderNumber();
        };
    }

    private String buildOrderConfirmationHtml(Order order) {
        return buildOrderEmailHtml(
                order,
                "Votre commande a été enregistrée",
                "Merci pour votre commande. Nous avons bien reçu votre demande et nous allons la traiter rapidement.",
                "Vous paierez en espèces au moment de la livraison."
        );
    }

    private String buildOrderStatusHtml(Order order, OrderStatus newStatus) {
        return buildOrderEmailHtml(
                order,
                statusTitle(newStatus),
                statusMessage(newStatus),
                statusFooterNote(newStatus)
        );
    }

    private String buildOrderEmailHtml(Order order, String title, String intro, String note) {
        return """
                <!doctype html>
                <html lang="fr">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>%s</title>
                </head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111111;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;margin:0;padding:32px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:100%%;background:#ffffff;border:1px solid #e5e7eb;border-radius:22px;overflow:hidden;">
                          %s
                          %s
                          %s
                          %s
                          %s
                          %s
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escapeHtml(title),
                buildBrandBlock(),
                buildHeaderBlock(title, intro),
                buildOrderInfoBlock(order),
                buildItemsBlock(order),
                buildAddressBlock(order, note),
                buildFooterBlock()
        );
    }

    private String buildBrandBlock() {
        return """
                <tr>
                  <td style="padding:26px 32px 18px 32px;background:#ffffff;">
                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#111111;">%s</div>
                    <div style="margin-top:6px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Premium monochrome e-commerce</div>
                  </td>
                </tr>
                """.formatted(escapeHtml(emailProperties.getStoreName()));
    }

    private String buildHeaderBlock(String title, String intro) {
        return """
                <tr>
                  <td style="padding:0 32px 28px 32px;background:#ffffff;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background:#0b0b0b;border-radius:18px;">
                      <tr>
                        <td style="padding:28px 28px;">
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;font-weight:700;color:#ffffff;">%s</div>
                          <div style="margin-top:12px;font-size:15px;line-height:1.7;color:#d1d5db;">%s</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                """.formatted(escapeHtml(title), escapeHtml(intro));
    }

    private String buildOrderInfoBlock(Order order) {
        return """
                <tr>
                  <td style="padding:0 32px 24px 32px;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb;border-radius:16px;">
                      <tr>
                        <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;font-weight:700;font-size:16px;">Informations commande</td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;">
                          %s
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                """.formatted(
                infoRow("Numéro de commande", order.getOrderNumber())
                        + infoRow("Mode de paiement", "Cash on Delivery")
                        + infoRow("Statut paiement", String.valueOf(order.getPaymentStatus()))
                        + infoRow("Statut commande", String.valueOf(order.getStatus()))
        );
    }

    private String buildItemsBlock(Order order) {
        return """
                <tr>
                  <td style="padding:0 32px 24px 32px;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                      <tr>
                        <td colspan="4" style="padding:18px 20px;font-weight:700;font-size:16px;background:#ffffff;">Produits</td>
                      </tr>
                      <tr style="background:#f9fafb;">
                        <td style="padding:12px 16px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;border-top:1px solid #e5e7eb;">Produit</td>
                        <td align="center" style="padding:12px 16px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;border-top:1px solid #e5e7eb;">Quantité</td>
                        <td align="right" style="padding:12px 16px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;border-top:1px solid #e5e7eb;">Prix</td>
                        <td align="right" style="padding:12px 16px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;border-top:1px solid #e5e7eb;">Sous-total</td>
                      </tr>
                      %s
                      %s
                    </table>
                  </td>
                </tr>
                """.formatted(buildItemRows(order), buildTotalsRows(order));
    }

    private String buildItemRows(Order order) {
        StringBuilder rows = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            rows.append("""
                    <tr>
                      <td style="padding:14px 16px;border-top:1px solid #eef0f3;font-size:14px;line-height:1.5;color:#111111;">%s</td>
                      <td align="center" style="padding:14px 16px;border-top:1px solid #eef0f3;font-size:14px;color:#111111;">%s</td>
                      <td align="right" style="padding:14px 16px;border-top:1px solid #eef0f3;font-size:14px;color:#111111;">%s</td>
                      <td align="right" style="padding:14px 16px;border-top:1px solid #eef0f3;font-size:14px;font-weight:700;color:#111111;">%s</td>
                    </tr>
                    """.formatted(
                    escapeHtml(item.getProductName()),
                    item.getQuantity(),
                    formatAmount(item.getUnitPrice()),
                    formatAmount(item.getSubtotal())
            ));
        }
        return rows.toString();
    }

    private String buildTotalsRows(Order order) {
        BigDecimal subtotal = amountOrFallback(order.getSubtotalAmount(), order.getTotalAmount());
        BigDecimal discount = amountOrFallback(order.getDiscountAmount(), ZERO);
        BigDecimal deliveryFee = amountOrFallback(order.getDeliveryFee(), ZERO);
        BigDecimal total = amountOrFallback(order.getTotalAmount(), subtotal.subtract(discount));

        StringBuilder rows = new StringBuilder();
        rows.append(totalRow("Sous-total", formatAmount(subtotal), false));
        if (discount.compareTo(ZERO) > 0) {
            String label = order.getCouponCode() == null
                    ? "Discount"
                    : "Discount (" + escapeHtml(order.getCouponCode()) + ")";
            rows.append(totalRow(label, "-" + formatAmount(discount), false));
        }
        rows.append(totalRow("Livraison", formatAmount(deliveryFee), false));
        rows.append(totalRow("Total", formatAmount(total), true));
        return rows.toString();
    }

    private String buildAddressBlock(Order order, String note) {
        return """
                <tr>
                  <td style="padding:0 32px 28px 32px;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="50%%" valign="top" style="padding:18px 20px;border:1px solid #e5e7eb;border-radius:16px;">
                          <div style="font-weight:700;font-size:16px;margin-bottom:12px;">Adresse de livraison</div>
                          <div style="font-size:14px;line-height:1.8;color:#374151;">
                            <strong>%s</strong><br>
                            %s<br>
                            %s
                          </div>
                        </td>
                        <td width="18" style="font-size:0;line-height:0;">&nbsp;</td>
                        <td width="50%%" valign="top" style="padding:18px 20px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;">
                          <div style="font-weight:700;font-size:16px;margin-bottom:12px;">Paiement</div>
                          <div style="font-size:14px;line-height:1.8;color:#374151;">Cash on Delivery</div>
                          <div style="margin-top:10px;font-size:13px;line-height:1.7;color:#6b7280;">%s</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                """.formatted(
                escapeHtml(nullToFallback(order.getCustomerName(), "Client ShopSphere")),
                escapeHtml(nullToFallback(order.getCustomerPhone(), "Téléphone non fourni")),
                escapeHtml(nullToFallback(order.getShippingAddress(), "Adresse non fournie")),
                escapeHtml(note)
        );
    }

    private String buildFooterBlock() {
        return """
                <tr>
                  <td style="padding:22px 32px 30px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                    <div style="font-weight:700;font-size:14px;color:#111111;">ShopSphere Support</div>
                    <div style="margin-top:6px;font-size:13px;line-height:1.7;color:#6b7280;">
                      support@shopsphere.com<br>
                      Ce message est automatique, merci de ne pas y répondre directement.
                    </div>
                  </td>
                </tr>
                """;
    }

    private String infoRow(String label, String value) {
        return """
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#6b7280;">%s</td>
                    <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#111111;">%s</td>
                  </tr>
                </table>
                """.formatted(escapeHtml(label), escapeHtml(nullToFallback(value, "-")));
    }

    private String totalRow(String label, String value, boolean strong) {
        String fontSize = strong ? "18px" : "14px";
        String weight = strong ? "800" : "600";
        String border = strong ? "border-top:2px solid #111111;" : "border-top:1px solid #eef0f3;";
        return """
                <tr>
                  <td colspan="3" align="right" style="padding:12px 16px;%s;font-size:%s;font-weight:%s;color:#111111;">%s</td>
                  <td align="right" style="padding:12px 16px;%s;font-size:%s;font-weight:%s;color:#111111;">%s</td>
                </tr>
                """.formatted(
                border,
                fontSize,
                weight,
                escapeHtml(label),
                border,
                fontSize,
                weight,
                escapeHtml(value)
        );
    }

    private String statusTitle(OrderStatus status) {
        return switch (status) {
            case CONFIRMED -> "Votre commande est confirmée";
            case SHIPPED -> "Votre commande est expédiée";
            case DELIVERED -> "Votre commande est livrée";
            case CANCELLED -> "Votre commande est annulée";
            case PENDING -> "Mise à jour de votre commande";
        };
    }

    private String statusMessage(OrderStatus status) {
        return switch (status) {
            case CONFIRMED -> "Votre commande a été confirmée. Notre équipe prépare maintenant vos articles.";
            case SHIPPED -> "Votre commande a été expédiée et se dirige vers votre adresse de livraison.";
            case DELIVERED -> "Votre commande a été livrée. Merci pour votre confiance.";
            case CANCELLED -> "Votre commande a été annulée. Le stock des produits a été restauré automatiquement.";
            case PENDING -> "Le statut de votre commande a été mis à jour.";
        };
    }

    private String statusFooterNote(OrderStatus status) {
        return switch (status) {
            case CANCELLED -> "Si cette annulation n'était pas prévue, contactez le support ShopSphere.";
            case DELIVERED -> "Merci pour votre achat. Nous espérons vous revoir bientôt.";
            default -> "Vous paierez en espèces au moment de la livraison.";
        };
    }

    private BigDecimal amountOrFallback(BigDecimal amount, BigDecimal fallback) {
        return amount == null ? fallback : amount;
    }

    private String formatAmount(BigDecimal amount) {
        return amountOrFallback(amount, ZERO).toPlainString() + " DH";
    }

    private String nullToFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private record EmailContent(String subject, String body) {
    }

    @FunctionalInterface
    private interface OrderEmailContentFactory {
        EmailContent create(Order order);
    }
}
