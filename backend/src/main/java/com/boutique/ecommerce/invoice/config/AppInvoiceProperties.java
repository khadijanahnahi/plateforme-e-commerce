package com.boutique.ecommerce.invoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.invoice")
public class AppInvoiceProperties {

    private String storagePath = "./storage/invoices";

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }
}
