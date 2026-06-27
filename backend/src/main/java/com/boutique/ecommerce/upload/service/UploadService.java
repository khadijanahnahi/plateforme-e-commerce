package com.boutique.ecommerce.upload.service;

import com.boutique.ecommerce.upload.dto.UploadResponse;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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

    public UploadService(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret,
            @Value("${cloudinary.product-folder:shopsphere/products}") String productFolder
    ) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.productFolder = productFolder;
    }

    public UploadResponse uploadProductImage(MultipartFile file) {
        validateCloudinaryConfig();
        validateImage(file);

        try {
            Cloudinary cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));

            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
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

    private void validateCloudinaryConfig() {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new IllegalArgumentException("Cloudinary configuration is missing.");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only JPG, JPEG, PNG and WEBP images are allowed.");
        }

        String extension = getExtension(file.getOriginalFilename());
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
}
