package com.boutique.ecommerce.invoice.service;

import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.invoice.dto.InvoiceItemResponse;
import com.boutique.ecommerce.invoice.dto.InvoiceResponse;
import com.boutique.ecommerce.invoice.entity.Invoice;
import com.boutique.ecommerce.invoice.entity.InvoiceItem;
import com.boutique.ecommerce.invoice.service.InvoiceFileStorageService.InvoiceFile;
import com.boutique.ecommerce.invoice.repository.InvoiceRepository;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import com.boutique.ecommerce.settings.entity.StoreSettings;
import com.boutique.ecommerce.settings.repository.StoreSettingsRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
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
    private final InvoiceFileStorageService invoiceFileStorageService;
    private final StoreSettingsRepository storeSettingsRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            InvoicePdfService invoicePdfService,
            InvoiceFileStorageService invoiceFileStorageService,
            StoreSettingsRepository storeSettingsRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.invoicePdfService = invoicePdfService;
        this.invoiceFileStorageService = invoiceFileStorageService;
        this.storeSettingsRepository = storeSettingsRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public InvoiceResponse createInvoiceForPaidOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        validateInvoiceAllowed(order);

        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseGet(() -> invoiceRepository.save(buildInvoice(order)));
        ensurePdfExists(invoice);
        return mapToResponse(invoice);
    }

    @Transactional
    public InvoiceResponse getInvoiceForCustomer(Long orderId) {
        AppUser user = getCurrentUser();
        Invoice invoice = findOrCreateInvoiceForCustomer(orderId, user);
        return mapToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceForAdmin(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found."));
        return mapToResponse(invoice);
    }

    @Transactional
    public InvoiceDownload getInvoiceDownloadForCustomer(Long orderId) {
        AppUser user = getCurrentUser();
        Invoice invoice = findOrCreateInvoiceForCustomer(orderId, user);
        return toDownload(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceDownload getInvoiceDownloadForAdmin(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found."));
        return toDownload(invoice);
    }

    @Transactional
    public InvoiceResponse regenerateInvoiceForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        validateInvoiceAllowed(order);

        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseGet(() -> invoiceRepository.save(buildInvoice(order)));
        String pdfLocation = invoicePdfService.generatePdf(invoice);
        invoice.setPdfUrl(pdfLocation);
        log.info("Invoice PDF regenerated. orderId={} invoiceNumber={}", orderId, invoice.getInvoiceNumber());
        return mapToResponse(invoice);
    }

    private Invoice findOrCreateInvoiceForCustomer(Long orderId, AppUser user) {
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        validateInvoiceAllowed(order);

        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseGet(() -> invoiceRepository.save(buildInvoice(order)));
        ensurePdfExists(invoice);
        return invoice;
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
        if (hasCurrentPdf(invoice)) {
            return;
        }

        try {
            String pdfLocation = invoicePdfService.generatePdf(invoice);
            invoice.setPdfUrl(pdfLocation);
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

    private boolean hasCurrentPdf(Invoice invoice) {
        String pdfUrl = invoice.getPdfUrl();
        return invoiceFileStorageService.exists(pdfUrl)
                && pdfUrl.contains("-" + InvoicePdfService.TEMPLATE_VERSION + ".pdf");
    }

    private InvoiceDownload toDownload(Invoice invoice) {
        InvoiceFile file = invoiceFileStorageService.download(invoice.getPdfUrl());
        return new InvoiceDownload(invoice.getInvoiceNumber(), file.resource(), file.contentLength());
    }

    private String generateInvoiceNumber() {
        String invoiceNumber;
        do {
            invoiceNumber = resolveInvoicePrefix() + "-" + LocalDateTime.now().getYear() + "-"
                    + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        } while (invoiceRepository.existsByInvoiceNumber(invoiceNumber));
        return invoiceNumber;
    }

    private String resolveInvoicePrefix() {
        return storeSettingsRepository.findById(StoreSettings.GLOBAL_SETTINGS_ID)
                .map(StoreSettings::getInvoicePrefix)
                .filter(prefix -> !prefix.isBlank())
                .orElse("INV");
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

    public record InvoiceDownload(String invoiceNumber, Resource resource, long contentLength) {
    }
}
