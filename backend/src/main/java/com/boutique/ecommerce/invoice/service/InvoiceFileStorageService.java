package com.boutique.ecommerce.invoice.service;

import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.invoice.config.AppInvoiceProperties;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class InvoiceFileStorageService {

    private static final String MINIO_PREFIX = "minio://";

    private final AppInvoiceProperties invoiceProperties;
    private final MinioClient minioClient;

    public InvoiceFileStorageService(AppInvoiceProperties invoiceProperties) {
        this.invoiceProperties = invoiceProperties;
        this.minioClient = MinioClient.builder()
                .endpoint(invoiceProperties.getMinioEndpoint())
                .credentials(invoiceProperties.getMinioAccessKey(), invoiceProperties.getMinioSecretKey())
                .build();
    }

    public String store(byte[] pdfContent, String invoiceNumber) {
        if (pdfContent == null || pdfContent.length == 0) {
            throw new IllegalArgumentException("Invoice PDF content must not be empty.");
        }
        if (isMinioEnabled()) {
            return storeInMinio(pdfContent, invoiceNumber);
        }
        return storeLocally(pdfContent, invoiceNumber);
    }

    public boolean exists(String location) {
        if (location == null || location.isBlank()) {
            return false;
        }
        if (location.startsWith(MINIO_PREFIX)) {
            return minioExists(location);
        }
        return Files.exists(Path.of(location));
    }

    public InvoiceFile download(String location) {
        if (location == null || location.isBlank()) {
            throw new ResourceNotFoundException("Invoice PDF is not available.");
        }
        if (location.startsWith(MINIO_PREFIX)) {
            return downloadFromMinio(location);
        }
        return downloadLocal(location);
    }

    private String storeLocally(byte[] pdfContent, String invoiceNumber) {
        try {
            Path storageDirectory = Path.of(invoiceProperties.getStoragePath()).toAbsolutePath().normalize();
            Files.createDirectories(storageDirectory);
            Path targetPath = storageDirectory.resolve(invoiceNumber + ".pdf").normalize();
            if (!targetPath.startsWith(storageDirectory)) {
                throw new IllegalArgumentException("Invalid invoice file name.");
            }
            Files.write(
                    targetPath,
                    pdfContent,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE
            );
            return targetPath.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to store invoice PDF locally.", exception);
        }
    }

    private String storeInMinio(byte[] pdfContent, String invoiceNumber) {
        try {
            ensureBucketExists();
            String objectName = normalizePrefix(invoiceProperties.getMinioPrefix()) + invoiceNumber + ".pdf";
            try (InputStream inputStream = new ByteArrayInputStream(pdfContent)) {
                minioClient.putObject(PutObjectArgs.builder()
                        .bucket(invoiceProperties.getMinioBucket())
                        .object(objectName)
                        .stream(inputStream, pdfContent.length, -1)
                        .contentType("application/pdf")
                        .build());
            }
            return MINIO_PREFIX + invoiceProperties.getMinioBucket() + "/" + objectName;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to store invoice PDF in MinIO.", exception);
        }
    }

    private boolean minioExists(String location) {
        try {
            MinioLocation parsed = parseMinioLocation(location);
            minioClient.statObject(StatObjectArgs.builder()
                    .bucket(parsed.bucket())
                    .object(parsed.objectName())
                    .build());
            return true;
        } catch (ErrorResponseException exception) {
            return false;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to check invoice PDF in MinIO.", exception);
        }
    }

    private InvoiceFile downloadLocal(String location) {
        Path pdfPath = Path.of(location).toAbsolutePath().normalize();
        if (!Files.exists(pdfPath)) {
            throw new ResourceNotFoundException("Invoice PDF file not found.");
        }
        try {
            FileSystemResource resource = new FileSystemResource(pdfPath);
            return new InvoiceFile(resource, resource.contentLength());
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to read invoice PDF.", exception);
        }
    }

    private InvoiceFile downloadFromMinio(String location) {
        try {
            MinioLocation parsed = parseMinioLocation(location);
            long size = minioClient.statObject(StatObjectArgs.builder()
                    .bucket(parsed.bucket())
                    .object(parsed.objectName())
                    .build()).size();
            InputStream inputStream = minioClient.getObject(GetObjectArgs.builder()
                    .bucket(parsed.bucket())
                    .object(parsed.objectName())
                    .build());
            return new InvoiceFile(new InputStreamResource(inputStream), size);
        } catch (ErrorResponseException exception) {
            throw new ResourceNotFoundException("Invoice PDF file not found.");
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to download invoice PDF from MinIO.", exception);
        }
    }

    private void ensureBucketExists() throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder()
                .bucket(invoiceProperties.getMinioBucket())
                .build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder()
                    .bucket(invoiceProperties.getMinioBucket())
                    .build());
        }
    }

    private boolean isMinioEnabled() {
        return "minio".equalsIgnoreCase(invoiceProperties.getStorageProvider());
    }

    private String normalizePrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return "";
        }
        return prefix.endsWith("/") ? prefix : prefix + "/";
    }

    private MinioLocation parseMinioLocation(String location) {
        String withoutScheme = location.substring(MINIO_PREFIX.length());
        int slashIndex = withoutScheme.indexOf('/');
        if (slashIndex <= 0 || slashIndex == withoutScheme.length() - 1) {
            throw new ResourceNotFoundException("Invalid invoice PDF location.");
        }
        return new MinioLocation(withoutScheme.substring(0, slashIndex), withoutScheme.substring(slashIndex + 1));
    }

    public record InvoiceFile(Resource resource, long contentLength) {
    }

    private record MinioLocation(String bucket, String objectName) {
    }
}
