package com.boutique.ecommerce.invoice.event;

import com.boutique.ecommerce.invoice.service.InvoiceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class InvoiceEventListener {

    private static final Logger log = LoggerFactory.getLogger(InvoiceEventListener.class);

    private final InvoiceService invoiceService;

    public InvoiceEventListener(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleInvoiceRequested(InvoiceRequestedEvent event) {
        try {
            invoiceService.createInvoiceForPaidOrder(event.orderId());
        } catch (RuntimeException exception) {
            log.error("Invoice generation failed after payment commit. orderId={}", event.orderId(), exception);
        }
    }
}
