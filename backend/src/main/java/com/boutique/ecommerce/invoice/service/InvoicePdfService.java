package com.boutique.ecommerce.invoice.service;

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
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Service;

@Service
public class InvoicePdfService {

    public static final String TEMPLATE_VERSION = "v2";

    private static final Color BLACK = new Color(17, 17, 17);
    private static final Color WHITE = Color.WHITE;
    private static final Color SOFT_GRAY = new Color(250, 250, 250);
    private static final Color LIGHT_GRAY = new Color(245, 245, 245);
    private static final Color BORDER_GRAY = new Color(220, 220, 220);
    private static final Color TEXT_GRAY = new Color(91, 91, 91);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final InvoiceFileStorageService invoiceFileStorageService;

    public InvoicePdfService(InvoiceFileStorageService invoiceFileStorageService) {
        this.invoiceFileStorageService = invoiceFileStorageService;
    }

    public String generatePdf(Invoice invoice) {
        Path tempPdf = null;
        try {
            tempPdf = Files.createTempFile("shopsphere-invoice-", ".pdf");

            try (OutputStream outputStream = Files.newOutputStream(tempPdf)) {
                Document document = new Document(PageSize.A4, 42, 42, 42, 42);
                PdfWriter.getInstance(document, outputStream);
                document.open();
                buildDocument(document, invoice);
                document.close();
            }

            return invoiceFileStorageService.store(tempPdf, invoice.getInvoiceNumber() + "-" + TEMPLATE_VERSION);
        } catch (DocumentException | IOException exception) {
            throw new IllegalStateException("Unable to generate invoice PDF.", exception);
        } finally {
            if (tempPdf != null) {
                try {
                    Files.deleteIfExists(tempPdf);
                } catch (IOException ignored) {
                    // Temporary PDF cleanup failure must not break invoice generation.
                }
            }
        }
    }

    private void buildDocument(Document document, Invoice invoice) throws DocumentException {
        document.add(buildHeader());
        document.add(buildPartyAndInvoiceInfo(invoice));

        Paragraph productsTitle = new Paragraph("Produits", headingFont());
        productsTitle.setSpacingBefore(8);
        productsTitle.setSpacingAfter(10);
        document.add(productsTitle);
        document.add(buildItemsTable(invoice));
        document.add(buildTotalsTable(invoice));
        document.add(buildFooter());
    }

    private PdfPTable buildHeader() throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.35f, 1});
        table.setSpacingAfter(24);

        PdfPCell brandCell = new PdfPCell();
        brandCell.setBorder(Rectangle.NO_BORDER);
        brandCell.setPadding(0);
        brandCell.addElement(new Paragraph("ShopSphere", brandFont()));
        brandCell.addElement(new Paragraph("Premium monochrome essentials", mutedFont()));
        table.addCell(brandCell);

        PdfPCell titleCell = new PdfPCell(new Phrase("FACTURE", invoiceTitleFont()));
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        titleCell.setVerticalAlignment(Element.ALIGN_TOP);
        titleCell.setPadding(0);
        table.addCell(titleCell);

        return table;
    }

    private PdfPTable buildPartyAndInvoiceInfo(Invoice invoice) throws DocumentException {
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1, 1, 1.15f});
        table.setSpacingAfter(22);

        table.addCell(infoBlock("Vendeur", """
                ShopSphere
                support@shopsphere.ma
                Fes, Maroc
                shopsphere.ma
                """));
        table.addCell(infoBlock("Client", """
                %s
                %s
                %s
                %s
                """.formatted(
                value(invoice.getCustomerName()),
                value(invoice.getCustomerEmail()),
                value(invoice.getCustomerPhone()),
                value(invoice.getBillingAddress())
        )));
        table.addCell(infoBlock("Informations facture", """
                Facture: %s
                Commande: %s
                Date: %s
                Paiement: %s
                Statut paiement: %s
                Statut commande: %s
                """.formatted(
                invoice.getInvoiceNumber(),
                invoice.getOrder().getOrderNumber(),
                invoice.getIssuedAt() == null ? "-" : invoice.getIssuedAt().format(DATE_FORMATTER),
                translatePaymentMethod(invoice.getPaymentMethod()),
                translatePaymentStatus(invoice.getPaymentStatus()),
                translateOrderStatus(invoice.getOrder().getStatus().name())
        )));

        return table;
    }

    private PdfPTable buildItemsTable(Invoice invoice) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{4.2f, 0.9f, 1.7f, 1.8f});
        table.setSpacingAfter(18);

        table.addCell(headerCell("Produit"));
        table.addCell(headerCell("Qte"));
        table.addCell(headerCell("Prix unitaire"));
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
        table.setWidthPercentage(46);
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.setWidths(new float[]{1, 1});
        table.setSpacingBefore(4);

        addTotalRow(table, "Sous-total", invoice.getSubtotalAmount(), false);
        addTotalRow(table, "Reduction", invoice.getDiscountAmount().negate(), false);
        addTotalRow(table, "Livraison", invoice.getDeliveryFee(), false);
        addTotalRow(table, "Total", invoice.getTotalAmount(), true);
        return table;
    }

    private void addTotalRow(PdfPTable table, String label, BigDecimal amount, boolean strong) {
        Font font = strong ? totalFont() : normalFont();
        table.addCell(totalCell(label, font, Element.ALIGN_LEFT, strong));
        table.addCell(totalCell(formatAmount(amount), font, Element.ALIGN_RIGHT, strong));
    }

    private PdfPCell infoBlock(String title, String content) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER_GRAY);
        cell.setBackgroundColor(SOFT_GRAY);
        cell.setPadding(14);
        cell.setMinimumHeight(132);

        Paragraph heading = new Paragraph(title.toUpperCase(), smallHeadingFont());
        heading.setSpacingAfter(8);
        cell.addElement(heading);
        cell.addElement(new Paragraph(content.trim(), normalFont()));
        return cell;
    }

    private PdfPCell headerCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, tableHeaderFont()));
        cell.setBackgroundColor(BLACK);
        cell.setBorderColor(BLACK);
        cell.setPadding(10);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private PdfPCell bodyCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(value(text), normalFont()));
        cell.setBorderColor(BORDER_GRAY);
        cell.setPadding(10);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private PdfPCell totalCell(String text, Font font, int alignment, boolean strong) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorderColor(BORDER_GRAY);
        cell.setBackgroundColor(strong ? LIGHT_GRAY : WHITE);
        cell.setPadding(10);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private Paragraph buildFooter() {
        Paragraph footer = new Paragraph(
                "Merci pour votre achat.\n"
                        + "Cette facture a ete generee automatiquement par ShopSphere.\n"
                        + "Pour toute question : support@shopsphere.ma",
                mutedFont()
        );
        footer.setSpacingBefore(28);
        footer.setAlignment(Element.ALIGN_CENTER);
        return footer;
    }

    private String translatePaymentMethod(String value) {
        if ("CASH_ON_DELIVERY".equals(value)) {
            return "Paiement a la livraison";
        }
        return value(value);
    }

    private String translatePaymentStatus(String value) {
        return switch (value(value)) {
            case "PAID" -> "Paye";
            case "UNPAID" -> "Non paye";
            case "FAILED" -> "Echec paiement";
            default -> value(value);
        };
    }

    private String translateOrderStatus(String value) {
        return switch (value(value)) {
            case "PENDING" -> "En attente";
            case "CONFIRMED" -> "Confirmee";
            case "SHIPPED" -> "Expediee";
            case "DELIVERED" -> "Livree";
            case "CANCELLED" -> "Annulee";
            default -> value(value);
        };
    }

    private String formatAmount(BigDecimal amount) {
        return (amount == null ? BigDecimal.ZERO : amount).toPlainString() + " DH";
    }

    private String value(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private Font brandFont() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28, BLACK);
    }

    private Font invoiceTitleFont() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, BLACK);
    }

    private Font headingFont() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BLACK);
    }

    private Font smallHeadingFont() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, TEXT_GRAY);
    }

    private Font normalFont() {
        return FontFactory.getFont(FontFactory.HELVETICA, 10.5f, BLACK);
    }

    private Font mutedFont() {
        return FontFactory.getFont(FontFactory.HELVETICA, 9.5f, TEXT_GRAY);
    }

    private Font tableHeaderFont() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, WHITE);
    }

    private Font totalFont() {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BLACK);
    }
}
