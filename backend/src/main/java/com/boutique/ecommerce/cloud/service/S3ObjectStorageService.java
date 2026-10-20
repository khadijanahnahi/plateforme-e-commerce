package com.boutique.ecommerce.cloud.service;

import com.boutique.ecommerce.cloud.config.AwsCloudProperties;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@ConditionalOnProperty(prefix = "app.cloud", name = "enabled", havingValue = "true")
public class S3ObjectStorageService {

    private static final String S3_PREFIX = "s3://";

    private final S3Client s3Client;
    private final AwsCloudProperties properties;

    public S3ObjectStorageService(S3Client s3Client, AwsCloudProperties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
    }

    public String putObject(String bucket, String key, byte[] bytes, String contentType) {
        s3Client.putObject(PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(bytes));
        return S3_PREFIX + bucket + "/" + key;
    }

    public StoredObject getObject(String location) {
        S3Location parsed = parse(location);
        var response = s3Client.getObject(GetObjectRequest.builder()
                .bucket(parsed.bucket())
                .key(parsed.key())
                .build());
        return new StoredObject(response, response.response().contentLength());
    }

    public boolean exists(String location) {
        try {
            S3Location parsed = parse(location);
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(parsed.bucket())
                    .key(parsed.key())
                    .build());
            return true;
        } catch (NoSuchKeyException exception) {
            return false;
        } catch (RuntimeException exception) {
            return false;
        }
    }

    public String productImagePublicUrl(String bucket, String key) {
        String prefix = properties.getS3().getProductMediaPublicUrlPrefix();
        if (prefix != null && !prefix.isBlank()) {
            return stripTrailingSlash(prefix) + "/" + key;
        }
        if (properties.getEndpoint() != null && !properties.getEndpoint().isBlank()) {
            return stripTrailingSlash(properties.getEndpoint()) + "/" + bucket + "/" + key;
        }
        return S3_PREFIX + bucket + "/" + key;
    }

    public static boolean isS3Location(String location) {
        return location != null && location.startsWith(S3_PREFIX);
    }

    private S3Location parse(String location) {
        if (!isS3Location(location)) {
            throw new IllegalArgumentException("Invalid S3 location.");
        }
        String withoutScheme = location.substring(S3_PREFIX.length());
        int slashIndex = withoutScheme.indexOf('/');
        if (slashIndex <= 0 || slashIndex == withoutScheme.length() - 1) {
            throw new IllegalArgumentException("Invalid S3 location.");
        }
        return new S3Location(withoutScheme.substring(0, slashIndex), withoutScheme.substring(slashIndex + 1));
    }

    private String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    public record StoredObject(InputStream inputStream, long contentLength) {
        public StoredObject(byte[] bytes) {
            this(new ByteArrayInputStream(bytes), bytes.length);
        }
    }

    private record S3Location(String bucket, String key) {
    }
}
