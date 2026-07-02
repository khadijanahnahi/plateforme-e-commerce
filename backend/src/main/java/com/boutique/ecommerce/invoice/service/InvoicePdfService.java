package com.boutique.ecommerce.invoice.service;

import com.boutique.ecommerce.invoice.config.AppInvoiceProperties;
import com.boutique.ecommerce.invoice.entity.Invoice;
import com.boutique.ecommerce.invoice.entity.InvoiceItem;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.stereotype.Service;

@Service
public class InvoicePdfService {

    private static final Color BLACK = new Color(17, 17, 17);
    private static final Color LIGHT_GRAY = new Color(245, 245, 245);
    private static final Color BORDER_GRAY = new Color(220, 220, 220);

    private final AppInvoiceProperties invoiceProperties;

    public InvoicePdfService(AppInvoiceProperties invoiceProperties) {
        this.invoiceProperties = invoiceProperties;
    }

    public Path generatePdf(Invoice invoice) {
        try {
            Path storageDirectory = Path.of(invoiceProperties.getStoragePath()).toAbsolutePath().normalize();
            Files.createDirectories(storageDirectory);
            Path pdfPath = storageDirectory.resolve(invoice.getInvoiceNumber() + ".pdf");

            try (OutputStream outputStream = Files.newOutputStream(pdfPath)) {
                Document document = new Document(PageSize.A4, 42, 42, 42, 42);
                PdfWriter.getInstance(document, outputStream);
                document.open();
                buildDocument(document, invoice);
                document.close();
            }

            return pdfPath;
        } catch (DocumentException | IOException exception) {
            throw new IllegalStateException("Unable to generate invoice PDF.", exception);
        }
    }

    private void buildDocument(Document document, Invoice invoice) throws DocumentException {
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, BLACK);
        Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, BLACK);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BLACK);

        Paragraph brand = new Paragraph("ShopSphere", titleFont);
        brand.setAlignment(Element.ALIGN_LEFT);
        brand.setSpacingAfter(8);
        document.add(brand);

        Paragraph invoiceTitle = new Paragraph("FACTURE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BLACK));
        invoiceTitle.setSpacingAfter(16);
        document.add(invoiceTitle);

        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{1, 1});
        infoTable.setSpacingAfter(18);
        infoTable.addCell(infoCell("""
                Facture: %s
                Commande: %s
                Date: %s
                Paiement: %s
                Statut paiement: %s
                """.formatted(
                invoice.getInvoiceNumber(),
                invoice.getOrder().getOrderNumber(),
                invoice.getIssuedAt(),
                invoice.getPaymentMethod(),
                invoice.getPaymentStatus()
        ), normalFont));
        infoTable.addCell(infoCell("""
                Client: %s
                Email: %s
                Téléphone: %s
                Adresse:
                %s
                """.formatted(
                value(invoice.getCustomerName()),
                value(invoice.getCustomerEmail()),
                value(invoice.getCustomerPhone()),
                value(invoice.getBillingAddress())
        ), normalFont));
        document.add(infoTable);

        Paragraph productsTitle = new Paragraph("Produits", headingFont);
        productsTitle.setSpacingAfter(8);
        document.add(productsTitle);
        document.add(buildItemsTable(invoice));
        document.add(buildTotalsTable(invoice));

        Paragraph footer = new Paragraph(
                "Merci pour votre achat. Cette facture a été générée automatiquement par ShopSphere.",
                normalFont
        );
        footer.setSpacingBefore(24);
        document.add(footer);
    }

    private PdfPTable buildItemsTable(Invoice invoice) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{4, 1, 1.6f, 1.8f});
        table.setSpacingAfter(14);

        table.addCell(headerCell("Produit"));
        table.addCell(headerCell("Qté"));
        table.addCell(headerCell("Prix"));
        table.addCell(headerCell("Sous-total"));

        for (InvoiceItem item : invoice.getItems()) {
            table.addCell(bodyCell(item.getProductName(), Element.ALIGN_LEFT));
            table.addCell(bodyCell(String.valueOf(item.getQuantity()), Element.ALIGN_CENTER));
            table.addCell(bodyCell(formatAmount(item.getUnitPrice()), Element.ALIGN_RIGHT));
            table.addCell(bodyCell(formatAmount(item.getSubtotal()), Element.ALIGN_RIGHT));
        }

        return table;
    }

    private PdfPTable buildTotalsTable(Invoice invoice) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(45);
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.setWidths(new float[]{1, 1});

        addTotalRow(table, "Sous-total", invoice.getSubtotalAmount(), false);
        addTotalRow(table, "Discount", invoice.getDiscountAmount().negate(), false);
        addTotalRow(table, "Livraison", invoice.getDeliveryFee(), false);
        addTotalRow(table, "Total", invoice.getTotalAmount(), true);
        return table;
    }

    private void addTotalRow(PdfPTable table, String label, BigDecimal amount, boolean strong) {
        Font font = FontFactory.getFont(strong ? FontFactory.HELVETICA_BOLD : FontFactory.HELVETICA, 10, BLACK);
        table.addCell(totalCell(label, font, Element.ALIGN_LEFT));
        table.addCell(totalCell(formatAmount(amount), font, Element.ALIGN_RIGHT));
    }

    private PdfPCell infoCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorderColor(BORDER_GRAY);
        cell.setPadding(12);
        return cell;
    }

    private PdfPCell headerCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
        cell.setBackgroundColor(BLACK);
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private PdfPCell bodyCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(value(text), FontFactory.getFont(FontFactory.HELVETICA, 10, BLACK)));
        cell.setBorderColor(BORDER_GRAY);
        cell.setPadding(8);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private PdfPCell totalCell(String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorderColor(BORDER_GRAY);
        cell.setBackgroundColor(LIGHT_GRAY);
        cell.setPadding(8);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private String formatAmount(BigDecimal amount) {
        return (amount == null ? BigDecimal.ZERO : amount).toPlainString() + " DH";
    }

    private String value(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
