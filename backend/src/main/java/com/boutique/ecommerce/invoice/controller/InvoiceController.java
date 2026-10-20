package com.boutique.ecommerce.invoice.controller;

import com.boutique.ecommerce.invoice.dto.InvoiceResponse;
import com.boutique.ecommerce.invoice.service.InvoiceService;
import java.io.IOException;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<Resource> downloadMyInvoice(@PathVariable Long id) throws IOException {
        return buildPdfResponse(invoiceService.getInvoiceDownloadForCustomer(id));
    }

    @GetMapping("/{id}/invoice/info")
    public InvoiceResponse getMyInvoiceInfo(@PathVariable Long id) {
        return invoiceService.getInvoiceForCustomer(id);
    }

    private ResponseEntity<Resource> buildPdfResponse(InvoiceService.InvoiceDownload download) throws IOException {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(download.contentLength())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(download.invoiceNumber() + ".pdf")
                                .build()
                                .toString()
                )
                .body(download.resource());
    }
}
