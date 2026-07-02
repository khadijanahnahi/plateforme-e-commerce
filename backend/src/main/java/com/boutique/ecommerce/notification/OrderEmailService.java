package com.boutique.ecommerce.notification;

import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.order.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderEmailService {

    private static final Logger log = LoggerFactory.getLogger(OrderEmailService.class);

    private final OrderRepository orderRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final AppEmailProperties emailProperties;

    public OrderEmailService(
            OrderRepository orderRepository,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            AppEmailProperties emailProperties
    ) {
        this.orderRepository = orderRepository;
        this.mailSenderProvider = mailSenderProvider;
        this.emailProperties = emailProperties;
    }

    @Transactional(readOnly = true)
    public void sendOrderConfirmation(Long orderId) {
        if (!emailProperties.isEnabled()) {
            log.debug("Order confirmation email disabled. orderId={}", orderId);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Order confirmation email skipped: JavaMailSender is not configured. orderId={}", orderId);
            return;
        }

        Optional<Order> orderResult = orderRepository.findById(orderId);
        if (orderResult.isEmpty()) {
            log.warn("Order confirmation email skipped: order not found. orderId={}", orderId);
            return;
        }

        Order order = orderResult.get();
        if (order.getCustomerEmail() == null || order.getCustomerEmail().isBlank()) {
            log.warn("Order confirmation email skipped: customer email is empty. orderId={}", orderId);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(emailProperties.getFrom());
            message.setTo(order.getCustomerEmail());
            message.setSubject("Your " + emailProperties.getStoreName() + " order " + order.getOrderNumber());
            message.setText(buildConfirmationText(order));
            mailSender.send(message);
            log.info("Order confirmation email sent. orderId={} orderNumber={}", order.getId(), order.getOrderNumber());
        } catch (RuntimeException exception) {
            log.error(
                    "Order confirmation email failed. orderId={} orderNumber={}",
                    order.getId(),
                    order.getOrderNumber(),
                    exception
            );
        }
    }

    private String buildConfirmationText(Order order) {
        StringBuilder builder = new StringBuilder();
        builder.append("Hello ").append(nullToFallback(order.getCustomerName(), "customer")).append(",\n\n");
        builder.append("Thank you for your order at ").append(emailProperties.getStoreName()).append(".\n\n");
        builder.append("Order number: ").append(order.getOrderNumber()).append("\n");
        builder.append("Payment method: Cash on Delivery\n");
        builder.append("Payment status: ").append(order.getPaymentStatus()).append("\n");
        builder.append("Order status: ").append(order.getStatus()).append("\n\n");
        builder.append("Products:\n");

        for (OrderItem item : order.getItems()) {
            builder.append("- ")
                    .append(item.getProductName())
                    .append(" x ")
                    .append(item.getQuantity())
                    .append(" | ")
                    .append(formatAmount(item.getSubtotal()))
                    .append("\n");
        }

        builder.append("\nSubtotal: ").append(formatAmount(order.getSubtotalAmount())).append("\n");
        if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            builder.append("Discount");
            if (order.getCouponCode() != null) {
                builder.append(" (").append(order.getCouponCode()).append(")");
            }
            builder.append(": -").append(formatAmount(order.getDiscountAmount())).append("\n");
        }
        builder.append("Total: ").append(formatAmount(order.getTotalAmount())).append("\n\n");
        builder.append("Delivery address:\n").append(nullToFallback(order.getShippingAddress(), "Not provided")).append("\n\n");
        builder.append("You will pay in cash when your order is delivered.\n\n");
        builder.append("ShopSphere Support");
        return builder.toString();
    }

    private String formatAmount(BigDecimal amount) {
        return (amount == null ? BigDecimal.ZERO : amount).toPlainString() + " DH";
    }

    private String nullToFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
