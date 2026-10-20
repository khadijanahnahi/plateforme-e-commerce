package com.boutique.ecommerce.cloud.controller;

import com.boutique.ecommerce.cloud.config.AwsCloudProperties;
import com.boutique.ecommerce.cloud.service.S3ObjectStorageService;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import java.util.Locale;
import java.util.Set;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/media")
@ConditionalOnProperty(prefix = "app.cloud", name = "enabled", havingValue = "true")
public class PublicMediaController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");

    private final AwsCloudProperties properties;
    private final S3ObjectStorageService storageService;

    public PublicMediaController(AwsCloudProperties properties, S3ObjectStorageService storageService) {
        this.properties = properties;
        this.storageService = storageService;
    }

    @GetMapping("/products/{filename:.+}")
    public ResponseEntity<Resource> productImage(@PathVariable String filename) {
        String extension = extension(filename);
        if (!ALLOWED_EXTENSIONS.contains(extension) || filename.contains("/") || filename.contains("\\")) {
            throw new ResourceNotFoundException("Product image not found.");
        }

        String bucket = properties.getS3().getProductMediaBucket();
        String key = normalizePrefix(properties.getS3().getProductMediaPrefix()) + filename;
        String location = "s3://" + bucket + "/" + key;
        if (!storageService.exists(location)) {
            throw new ResourceNotFoundException("Product image not found.");
        }

        S3ObjectStorageService.StoredObject object = storageService.getObject(location);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType(extension)))
                .contentLength(object.contentLength())
                .cacheControl(CacheControl.noCache())
                .body(new InputStreamResource(object.inputStream()));
    }

    private String extension(String filename) {
        int dotIndex = filename == null ? -1 : filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            throw new ResourceNotFoundException("Product image not found.");
        }
        return filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private String contentType(String extension) {
        return switch (extension) {
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            default -> "image/jpeg";
        };
    }

    private String normalizePrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return "";
        }
        return prefix.endsWith("/") ? prefix : prefix + "/";
    }
}
