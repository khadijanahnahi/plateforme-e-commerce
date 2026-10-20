package com.boutique.ecommerce.blog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.blog")
public class BlogStorageProperties {
    private String storageProvider = "local";
    private String localPath = "./storage/blog";
    private String minioEndpoint = "http://127.0.0.1:9000";
    private String minioAccessKey = "minioadmin";
    private String minioSecretKey = "minioadmin";
    private String minioBucket = "shopsphere-media";
    private long maxImageSize = 5_242_880;

    public String getStorageProvider() { return storageProvider; }
    public void setStorageProvider(String value) { storageProvider = value; }
    public String getLocalPath() { return localPath; }
    public void setLocalPath(String value) { localPath = value; }
    public String getMinioEndpoint() { return minioEndpoint; }
    public void setMinioEndpoint(String value) { minioEndpoint = value; }
    public String getMinioAccessKey() { return minioAccessKey; }
    public void setMinioAccessKey(String value) { minioAccessKey = value; }
    public String getMinioSecretKey() { return minioSecretKey; }
    public void setMinioSecretKey(String value) { minioSecretKey = value; }
    public String getMinioBucket() { return minioBucket; }
    public void setMinioBucket(String value) { minioBucket = value; }
    public long getMaxImageSize() { return maxImageSize; }
    public void setMaxImageSize(long value) { maxImageSize = value; }
}
