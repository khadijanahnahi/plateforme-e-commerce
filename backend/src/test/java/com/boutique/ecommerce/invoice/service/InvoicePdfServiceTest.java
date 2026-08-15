package com.boutique.ecommerce.invoice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.boutique.ecommerce.invoice.entity.Invoice;
import com.boutique.ecommerce.invoice.entity.InvoiceItem;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.settings.repository.StoreSettingsRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InvoicePdfServiceTest {

    @Mock
    private InvoiceFileStorageService invoiceFileStorageService;

    @Mock
    private StoreSettingsRepository storeSettingsRepository;

    @Test
    void generatePdfBuildsStoresAndCleansUpTheDocument() throws Exception {
        InvoicePdfService service = new InvoicePdfService(invoiceFileStorageService, storeSettingsRepository);
        Invoice invoice = invoiceFixture();
        AtomicReference<Path> generatedPath = new AtomicReference<>();
        AtomicReference<byte[]> generatedBytes = new AtomicReference<>();

        when(storeSettingsRepository.findById(any())).thenReturn(Optional.empty());
        when(invoiceFileStorageService.store(any(Path.class), eq("INV-TEST-v2")))
                .thenAnswer(invocation -> {
                    Path path = invocation.getArgument(0);
                    generatedPath.set(path);
                    generatedBytes.set(Files.readAllBytes(path));
                    return "invoices/INV-TEST-v2.pdf";
                });

        String location = service.generatePdf(invoice);

        assertThat(location).isEqualTo("invoices/INV-TEST-v2.pdf");
        assertThat(generatedBytes.get()).isNotNull().hasSizeGreaterThan(500);
        assertThat(new String(generatedBytes.get(), 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
        assertThat(generatedPath.get()).isNotNull();
        assertThat(Files.exists(generatedPath.get())).isFalse();
    }

    private Invoice invoiceFixture() {
        Order order = Order.builder()
                .orderNumber("ORD-TEST")
                .status(OrderStatus.DELIVERED)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(new BigDecimal("203.97"))
                .build();

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-TEST")
                .order(order)
                .customerName("Client Test")
                .customerEmail("client@example.test")
                .customerPhone("+212600000000")
                .billingAddress("Adresse de test")
                .subtotalAmount(new BigDecimal("198.97"))
                .discountAmount(BigDecimal.ZERO)
                .deliveryFee(new BigDecimal("5.00"))
                .totalAmount(new BigDecimal("203.97"))
                .paymentMethod("CASH_ON_DELIVERY")
                .paymentStatus("PAID")
                .issuedAt(LocalDateTime.of(2026, 8, 15, 12, 0))
                .build();

        invoice.addItem(InvoiceItem.builder()
                .productName("Produit Test")
                .quantity(1)
                .unitPrice(new BigDecimal("198.97"))
                .subtotal(new BigDecimal("198.97"))
                .build());
        return invoice;
    }
}
