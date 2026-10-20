package com.boutique.ecommerce.blog.service;

import com.boutique.ecommerce.blog.config.BlogStorageProperties;
import com.boutique.ecommerce.blog.dto.BlogMediaUploadResponse;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BlogMediaStorageService {
    private static final Set<String> SCOPES = Set.of("covers", "content");
    private static final Map<String, String> CONTENT_EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );

    private final BlogStorageProperties properties;
    private final MinioClient minioClient;

    public BlogMediaStorageService(BlogStorageProperties properties) {
        this.properties = properties;
        this.minioClient = MinioClient.builder()
                .endpoint(properties.getMinioEndpoint())
                .credentials(properties.getMinioAccessKey(), properties.getMinioSecretKey())
                .build();
    }

    public BlogMediaUploadResponse upload(String scope, MultipartFile file) {
        validateScope(scope);
        try {
            byte[] bytes = file == null ? new byte[0] : file.getBytes();
            String contentType = validateImage(file, bytes);
            String filename = UUID.randomUUID() + "." + CONTENT_EXTENSIONS.get(contentType);
            String key = "blog/" + scope + "/" + filename;
            if (isMinio()) {
                ensureBucket();
                minioClient.putObject(PutObjectArgs.builder()
                        .bucket(properties.getMinioBucket())
                        .object(key)
                        .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                        .contentType(contentType)
                        .build());
            } else {
                Path target = localPath(key);
                Files.createDirectories(target.getParent());
                try (InputStream input = new ByteArrayInputStream(bytes)) {
                    Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
                }
            }
            return new BlogMediaUploadResponse(key, publicUrl(scope, filename), contentType);
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalArgumentException("Unable to store blog image.");
        }
    }

    public MediaFile read(String scope, String filename) {
        validateScope(scope);
        validateFilename(filename);
        String key = "blog/" + scope + "/" + filename;
        try {
            byte[] bytes;
            if (isMinio()) {
                try (InputStream input = minioClient.getObject(GetObjectArgs.builder()
                        .bucket(properties.getMinioBucket()).object(key).build())) {
                    bytes = input.readAllBytes();
                }
            } else {
                bytes = Files.readAllBytes(localPath(key));
            }
            return new MediaFile(bytes, contentType(filename));
        } catch (Exception exception) {
            throw new com.boutique.ecommerce.common.exception.ResourceNotFoundException("Blog image not found.");
        }
    }

    public void delete(String key) {
        if (key == null || !key.matches("blog/(covers|content)/[a-f0-9-]+\\.(jpg|png|webp)")) return;
        try {
            if (isMinio()) {
                minioClient.removeObject(RemoveObjectArgs.builder().bucket(properties.getMinioBucket()).object(key).build());
            } else {
                Files.deleteIfExists(localPath(key));
            }
        } catch (Exception exception) {
            throw new IllegalArgumentException("Unable to delete the previous blog image.");
        }
    }

    private String validateImage(MultipartFile file, byte[] bytes) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Image file is required.");
        if (file.getSize() > properties.getMaxImageSize()) throw new IllegalArgumentException("Image exceeds the allowed size.");
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!CONTENT_EXTENSIONS.containsKey(type)) throw new IllegalArgumentException("Only JPG, PNG and WEBP images are allowed.");
        if (!matchesSignature(type, bytes)) throw new IllegalArgumentException("Image content does not match its declared type.");
        return type;
    }

    private boolean matchesSignature(String type, byte[] bytes) {
        if ("image/jpeg".equals(type)) {
            return bytes.length >= 3 && unsigned(bytes[0]) == 0xff && unsigned(bytes[1]) == 0xd8 && unsigned(bytes[2]) == 0xff;
        }
        if ("image/png".equals(type)) {
            int[] signature = {0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
            if (bytes.length < signature.length) return false;
            for (int index = 0; index < signature.length; index++) {
                if (unsigned(bytes[index]) != signature[index]) return false;
            }
            return true;
        }
        return bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
    }

    private int unsigned(byte value) { return value & 0xff; }

    private void validateScope(String scope) {
        if (!SCOPES.contains(scope)) throw new IllegalArgumentException("Invalid blog media scope.");
    }

    private void validateFilename(String filename) {
        if (filename == null || !filename.matches("[a-f0-9-]+\\.(jpg|png|webp)")) {
            throw new IllegalArgumentException("Invalid blog image name.");
        }
    }

    private void ensureBucket() throws Exception {
        if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(properties.getMinioBucket()).build())) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(properties.getMinioBucket()).build());
        }
    }

    private Path localPath(String key) {
        Path root = Path.of(properties.getLocalPath()).toAbsolutePath().normalize();
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) throw new IllegalArgumentException("Invalid blog storage path.");
        return target;
    }

    private boolean isMinio() { return "minio".equalsIgnoreCase(properties.getStorageProvider()); }
    private String publicUrl(String scope, String filename) { return "/api/blog/media/" + scope + "/" + filename; }
    private String contentType(String filename) {
        if (filename.endsWith(".png")) return "image/png";
        if (filename.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    public record MediaFile(byte[] bytes, String contentType) {
        public InputStream inputStream() { return new ByteArrayInputStream(bytes); }
    }
}
