package com.boutique.ecommerce.upload.service;

import com.boutique.ecommerce.cloud.config.AwsCloudProperties;
import com.boutique.ecommerce.cloud.service.S3ObjectStorageService;
import com.boutique.ecommerce.upload.dto.UploadResponse;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final String productFolder;
    private final String storageProvider;
    private final AwsCloudProperties awsCloudProperties;
    private final ObjectProvider<S3ObjectStorageService> s3ObjectStorageService;

    public UploadService(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret,
            @Value("${cloudinary.product-folder:shopsphere/products}") String productFolder,
            @Value("${app.upload.storage-provider:cloudinary}") String storageProvider,
            AwsCloudProperties awsCloudProperties,
            ObjectProvider<S3ObjectStorageService> s3ObjectStorageService
    ) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.productFolder = productFolder;
        this.storageProvider = storageProvider;
        this.awsCloudProperties = awsCloudProperties;
        this.s3ObjectStorageService = s3ObjectStorageService;
    }

    public UploadResponse uploadProductImage(MultipartFile file) {
        validateImage(file);

        try {
            return uploadProductImage(file.getOriginalFilename(), file.getContentType(), file.getBytes());
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read image file.");
        }
    }

    public UploadResponse uploadProductImage(String filename, String contentType, byte[] bytes) {
        validateImage(filename, contentType, bytes);
        if (isS3Enabled()) {
            return uploadProductImageToS3(filename, contentType, bytes);
        }
        validateCloudinaryConfig();

        try {
            Cloudinary cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));

            Map<?, ?> result = cloudinary.uploader().upload(bytes, ObjectUtils.asMap(
                    "folder", productFolder,
                    "resource_type", "image",
                    "use_filename", false,
                    "unique_filename", true,
                    "overwrite", false
            ));

            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalArgumentException("Cloudinary did not return an image URL.");
            }

            return new UploadResponse(secureUrl.toString());
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to upload image to Cloudinary.");
        }
    }

    private UploadResponse uploadProductImageToS3(String filename, String contentType, byte[] bytes) {
        S3ObjectStorageService storageService = s3ObjectStorageService.getIfAvailable();
        if (storageService == null) {
            throw new IllegalArgumentException("S3 storage is not configured.");
        }
        String extension = getExtension(filename);
        String prefix = normalizePrefix(awsCloudProperties.getS3().getProductMediaPrefix());
        String key = prefix + UUID.randomUUID() + "." + extension;
        String bucket = awsCloudProperties.getS3().getProductMediaBucket();
        storageService.putObject(bucket, key, bytes, contentType);
        return new UploadResponse(storageService.productImagePublicUrl(bucket, key));
    }

    private void validateCloudinaryConfig() {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new IllegalArgumentException("Cloudinary configuration is missing.");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required.");
        }

        validateImage(file.getOriginalFilename(), file.getContentType(), new byte[] {1});
    }

    private void validateImage(String filename, String contentType, byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Image file is required.");
        }

        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only JPG, JPEG, PNG and WEBP images are allowed.");
        }

        String extension = getExtension(filename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Only JPG, JPEG, PNG and WEBP images are allowed.");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || filename.isBlank() || !filename.contains(".")) {
            throw new IllegalArgumentException("Image file must have a valid extension.");
        }

        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private boolean isS3Enabled() {
        return "s3".equalsIgnoreCase(storageProvider);
    }

    private String normalizePrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return "";
        }
        return prefix.endsWith("/") ? prefix : prefix + "/";
    }
}
