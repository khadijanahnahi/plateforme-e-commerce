package com.boutique.ecommerce.invoice.service;

import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.invoice.dto.InvoiceItemResponse;
import com.boutique.ecommerce.invoice.dto.InvoiceResponse;
import com.boutique.ecommerce.invoice.entity.Invoice;
import com.boutique.ecommerce.invoice.entity.InvoiceItem;
import com.boutique.ecommerce.invoice.repository.InvoiceRepository;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final String PAYMENT_METHOD_CASH_ON_DELIVERY = "CASH_ON_DELIVERY";

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InvoicePdfService invoicePdfService;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            InvoicePdfService invoicePdfService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.invoicePdfService = invoicePdfService;
    }

    @Transactional
    public InvoiceResponse createInvoiceForPaidOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        validateInvoiceAllowed(order);

        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseGet(() -> invoiceRepository.save(buildInvoice(order)));
        ensurePdfExists(invoice);
        return mapToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceForCustomer(Long orderId) {
        AppUser user = getCurrentUser();
        Invoice invoice = invoiceRepository.findByOrderIdAndOrderUserId(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found."));
        return mapToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceForAdmin(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found."));
        return mapToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceDownload getInvoiceDownloadForCustomer(Long orderId) {
        AppUser user = getCurrentUser();
        Invoice invoice = invoiceRepository.findByOrderIdAndOrderUserId(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found."));
        return new InvoiceDownload(invoice.getInvoiceNumber(), resolveExistingPdf(invoice));
    }

    @Transactional(readOnly = true)
    public InvoiceDownload getInvoiceDownloadForAdmin(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found."));
        return new InvoiceDownload(invoice.getInvoiceNumber(), resolveExistingPdf(invoice));
    }

    @Transactional
    public InvoiceResponse regenerateInvoiceForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        validateInvoiceAllowed(order);

        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseGet(() -> invoiceRepository.save(buildInvoice(order)));
        Path pdfPath = invoicePdfService.generatePdf(invoice);
        invoice.setPdfUrl(pdfPath.toString());
        log.info("Invoice PDF regenerated. orderId={} invoiceNumber={}", orderId, invoice.getInvoiceNumber());
        return mapToResponse(invoice);
    }

    private void validateInvoiceAllowed(Order order) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot generate invoice for a cancelled order.");
        }
        if (order.getPaymentStatus() != PaymentStatus.PAID) {
            throw new IllegalArgumentException("Invoice is available only after payment is received.");
        }
    }

    private Invoice buildInvoice(Order order) {
        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber())
                .order(order)
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .customerPhone(order.getCustomerPhone())
                .billingAddress(order.getShippingAddress())
                .subtotalAmount(amountOrFallback(order.getSubtotalAmount(), order.getTotalAmount()))
                .discountAmount(amountOrFallback(order.getDiscountAmount(), ZERO))
                .deliveryFee(ZERO)
                .totalAmount(amountOrFallback(order.getTotalAmount(), ZERO))
                .paymentMethod(PAYMENT_METHOD_CASH_ON_DELIVERY)
                .paymentStatus(order.getPaymentStatus().name())
                .issuedAt(LocalDateTime.now())
                .build();

        for (OrderItem orderItem : order.getItems()) {
            invoice.addItem(InvoiceItem.builder()
                    .productName(orderItem.getProductName())
                    .quantity(orderItem.getQuantity())
                    .unitPrice(orderItem.getUnitPrice())
                    .subtotal(orderItem.getSubtotal())
                    .build());
        }

        return invoice;
    }

    private void ensurePdfExists(Invoice invoice) {
        if (invoice.getPdfUrl() != null && Files.exists(Path.of(invoice.getPdfUrl()))) {
            return;
        }

        try {
            Path pdfPath = invoicePdfService.generatePdf(invoice);
            invoice.setPdfUrl(pdfPath.toString());
            log.info("Invoice PDF generated. orderId={} invoiceNumber={}", invoice.getOrder().getId(), invoice.getInvoiceNumber());
        } catch (RuntimeException exception) {
            log.error(
                    "Invoice PDF generation failed. orderId={} invoiceNumber={}",
                    invoice.getOrder().getId(),
                    invoice.getInvoiceNumber(),
                    exception
            );
        }
    }

    private Path resolveExistingPdf(Invoice invoice) {
        if (invoice.getPdfUrl() == null || invoice.getPdfUrl().isBlank()) {
            throw new ResourceNotFoundException("Invoice PDF is not available.");
        }

        Path pdfPath = Path.of(invoice.getPdfUrl()).toAbsolutePath().normalize();
        if (!Files.exists(pdfPath)) {
            throw new ResourceNotFoundException("Invoice PDF file not found.");
        }
        return pdfPath;
    }

    private String generateInvoiceNumber() {
        String invoiceNumber;
        do {
            invoiceNumber = "INV-" + LocalDateTime.now().getYear() + "-"
                    + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        } while (invoiceRepository.existsByInvoiceNumber(invoiceNumber));
        return invoiceNumber;
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required.");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
    }

    private BigDecimal amountOrFallback(BigDecimal amount, BigDecimal fallback) {
        return amount == null ? fallback : amount;
    }

    private InvoiceResponse mapToResponse(Invoice invoice) {
        List<InvoiceItemResponse> items = invoice.getItems().stream()
                .map(item -> new InvoiceItemResponse(
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()
                ))
                .toList();

        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getOrder().getId(),
                invoice.getOrder().getOrderNumber(),
                invoice.getCustomerName(),
                invoice.getCustomerEmail(),
                invoice.getCustomerPhone(),
                invoice.getBillingAddress(),
                invoice.getSubtotalAmount(),
                invoice.getDiscountAmount(),
                invoice.getDeliveryFee(),
                invoice.getTotalAmount(),
                invoice.getPaymentMethod(),
                invoice.getPaymentStatus(),
                invoice.getIssuedAt(),
                invoice.getPdfUrl(),
                items
        );
    }

    public record InvoiceDownload(String invoiceNumber, Path pdfPath) {
    }
}
