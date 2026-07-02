package com.boutique.ecommerce.invoice.repository;

import com.boutique.ecommerce.invoice.entity.Invoice;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByOrderId(Long orderId);

    Optional<Invoice> findByOrderIdAndOrderUserId(Long orderId, Long userId);

    boolean existsByInvoiceNumber(String invoiceNumber);

    boolean existsByOrderId(Long orderId);
}
