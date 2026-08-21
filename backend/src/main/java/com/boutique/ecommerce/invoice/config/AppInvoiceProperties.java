package com.boutique.ecommerce.invoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.invoice")
public class AppInvoiceProperties {

    private String storagePath = "./storage/invoices";
    private String storageProvider = "local";
    private String minioEndpoint = "http://127.0.0.1:9000";
    private String minioAccessKey = "minioadmin";
    private String minioSecretKey = "minioadmin";
    private String minioBucket = "shopsphere-invoices";
    private String minioPrefix = "invoices";
    private String s3Bucket = "shopsphere-invoices";
    private String s3Prefix = "invoices";

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getStorageProvider() {
        return storageProvider;
    }

    public void setStorageProvider(String storageProvider) {
        this.storageProvider = storageProvider;
    }

    public String getMinioEndpoint() {
        return minioEndpoint;
    }

    public void setMinioEndpoint(String minioEndpoint) {
        this.minioEndpoint = minioEndpoint;
    }

    public String getMinioAccessKey() {
        return minioAccessKey;
    }

    public void setMinioAccessKey(String minioAccessKey) {
        this.minioAccessKey = minioAccessKey;
    }

    public String getMinioSecretKey() {
        return minioSecretKey;
    }

    public void setMinioSecretKey(String minioSecretKey) {
        this.minioSecretKey = minioSecretKey;
    }

    public String getMinioBucket() {
        return minioBucket;
    }

    public void setMinioBucket(String minioBucket) {
        this.minioBucket = minioBucket;
    }

    public String getMinioPrefix() {
        return minioPrefix;
    }

    public void setMinioPrefix(String minioPrefix) {
        this.minioPrefix = minioPrefix;
    }

    public String getS3Bucket() {
        return s3Bucket;
    }

    public void setS3Bucket(String s3Bucket) {
        this.s3Bucket = s3Bucket;
    }

    public String getS3Prefix() {
        return s3Prefix;
    }

    public void setS3Prefix(String s3Prefix) {
        this.s3Prefix = s3Prefix;
    }
}
