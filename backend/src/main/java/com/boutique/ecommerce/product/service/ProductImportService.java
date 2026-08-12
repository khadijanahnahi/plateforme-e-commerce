package com.boutique.ecommerce.product.service;

import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.product.dto.ProductImportResponse;
import com.boutique.ecommerce.product.dto.ProductImportRowResponse;
import com.boutique.ecommerce.product.dto.ProductRequest;
import com.boutique.ecommerce.product.dto.ProductResponse;
import com.boutique.ecommerce.product.dto.ProductVariantRequest;
import com.boutique.ecommerce.product.entity.ProductAudience;
import com.boutique.ecommerce.product.entity.ProductSize;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.upload.service.UploadService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProductImportService {

    private static final int MAX_ROWS = 100;
    private static final long MAX_CSV_BYTES = 2L * 1024 * 1024;
    private static final long MAX_ZIP_BYTES = 100L * 1024 * 1024;
    private static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;
    private static final long MAX_UNCOMPRESSED_BYTES = 200L * 1024 * 1024;
    private static final List<ProductSize> CLOTHING_SIZES = List.of(
            ProductSize.XS, ProductSize.S, ProductSize.M,
            ProductSize.L, ProductSize.XL, ProductSize.XXL
    );

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final UploadService uploadService;
    private final Validator validator;

    public ProductImportService(
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            ProductService productService,
            UploadService uploadService,
            Validator validator
    ) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.productService = productService;
        this.uploadService = uploadService;
        this.validator = validator;
    }

    public ProductImportResponse importProducts(MultipartFile catalog, MultipartFile images, boolean dryRun) {
        validateFiles(catalog, images);
        Map<String, ImageAsset> imageAssets = readImages(images);
        List<ImportRow> importRows = readCatalog(catalog);
        Set<String> batchSkus = new HashSet<>();
        List<ProductImportRowResponse> results = new ArrayList<>();
        int validCount = 0;
        int importedCount = 0;

        for (ImportRow row : importRows) {
            try {
                PreparedProduct prepared = prepare(row, imageAssets, batchSkus);
                validCount++;

                if (dryRun) {
                    results.add(result(row, "VALID", null, "Ligne valide, prête à importer."));
                    continue;
                }

                String imageUrl = prepared.imageUrl();
                if (prepared.imageAsset() != null) {
                    ImageAsset image = prepared.imageAsset();
                    imageUrl = uploadService.uploadProductImage(
                            image.filename(), image.contentType(), image.bytes()
                    ).imageUrl();
                }

                ProductRequest request = withImage(prepared.request(), imageUrl);
                ProductResponse created = productService.create(request);
                importedCount++;
                results.add(result(row, "IMPORTED", created.id(), "Produit importé."));
            } catch (RuntimeException exception) {
                results.add(result(row, "ERROR", null, safeMessage(exception)));
            }
        }

        int failedCount = results.size() - (dryRun ? validCount : importedCount);
        return new ProductImportResponse(
                importRows.size(), validCount, importedCount, failedCount, dryRun, List.copyOf(results)
        );
    }

    public byte[] getTemplate() {
        String csv = String.join("\n",
                "name,description,price,sku,status,category,audience,image,stock,stock_xs,stock_s,stock_m,stock_l,stock_xl,stock_xxl",
                "T-shirt essentiel noir,T-shirt premium en coton,249.90,TSHIRT-BLK-001,DRAFT,T-shirts,UNISEXE,TSHIRT-BLK-001.webp,,5,10,12,10,6,3",
                "Pince mate,Accessoire monochrome,79.00,PINCE-BLK-001,DRAFT,Accessoires,FEMME,PINCE-BLK-001.jpg,25,,,,,,"
        );
        return csv.getBytes(StandardCharsets.UTF_8);
    }

    private PreparedProduct prepare(ImportRow row, Map<String, ImageAsset> images, Set<String> batchSkus) {
        String name = required(row, "name");
        String sku = required(row, "sku").toUpperCase(Locale.ROOT);
        if (!batchSkus.add(sku)) {
            throw new IllegalArgumentException("SKU dupliqué dans le fichier CSV.");
        }
        if (productRepository.findBySkuIgnoreCase(sku).isPresent()) {
            throw new IllegalArgumentException("Un produit utilise déjà ce SKU.");
        }

        Category category = categoryRepository.findByNameIgnoreCase(required(row, "category"))
                .filter(Category::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Catégorie active introuvable."));
        BigDecimal price = decimal(row, "price");
        ProductStatus status = enumValue(row, "status", ProductStatus.class, ProductStatus.DRAFT);
        ProductAudience audience = enumValue(row, "audience", ProductAudience.class, ProductAudience.UNISEXE);
        List<ProductVariantRequest> variants = variants(row, sku);
        int stock = variants.isEmpty()
                ? nonNegativeInteger(row, "stock", true)
                : variants.stream().mapToInt(ProductVariantRequest::stockQuantity).sum();

        String imageReference = required(row, "image");
        String imageUrl = null;
        ImageAsset imageAsset = null;
        if (imageReference.startsWith("https://")) {
            imageUrl = imageReference;
        } else {
            imageAsset = findImage(images, imageReference);
        }

        ProductRequest request = new ProductRequest(
                name,
                optional(row, "description"),
                price,
                stock,
                imageUrl,
                sku,
                status,
                category.getId(),
                audience,
                variants
        );
        Set<ConstraintViolation<ProductRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            throw new IllegalArgumentException(violations.iterator().next().getMessage());
        }
        return new PreparedProduct(request, imageUrl, imageAsset);
    }

    private List<ProductVariantRequest> variants(ImportRow row, String sku) {
        boolean hasSizes = CLOTHING_SIZES.stream()
                .anyMatch(size -> !optional(row, "stock_" + size.name().toLowerCase(Locale.ROOT)).isBlank());
        if (!hasSizes) {
            return List.of();
        }

        List<ProductVariantRequest> variants = new ArrayList<>();
        for (ProductSize size : CLOTHING_SIZES) {
            String column = "stock_" + size.name().toLowerCase(Locale.ROOT);
            int stock = nonNegativeInteger(row, column, false);
            variants.add(new ProductVariantRequest(null, size, stock, sku + "-" + size.name(), true));
        }
        return List.copyOf(variants);
    }

    private List<ImportRow> readCatalog(MultipartFile catalog) {
        try {
            byte[] bytes = catalog.getBytes();
            String csv = new String(bytes, StandardCharsets.UTF_8);
            if (csv.startsWith("\uFEFF")) {
                csv = csv.substring(1);
            }
            CSVFormat format = CSVFormat.DEFAULT.builder()
                    .setDelimiter(detectDelimiter(csv))
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreEmptyLines(true)
                    .setIgnoreSurroundingSpaces(true)
                    .setTrim(true)
                    .get();

            try (Reader reader = new InputStreamReader(
                    new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)), StandardCharsets.UTF_8
            ); CSVParser parser = format.parse(reader)) {
                Map<String, String> headers = normalizeHeaders(parser.getHeaderMap());
                validateHeaders(headers.keySet());
                List<ImportRow> rows = new ArrayList<>();
                for (CSVRecord record : parser) {
                    if (rows.size() >= MAX_ROWS) {
                        throw new IllegalArgumentException("Un import est limité à 100 produits.");
                    }
                    Map<String, String> values = new HashMap<>();
                    headers.forEach((normalized, original) -> values.put(normalized, record.get(original)));
                    rows.add(new ImportRow((int) record.getRecordNumber() + 1, values));
                }
                if (rows.isEmpty()) {
                    throw new IllegalArgumentException("Le catalogue CSV ne contient aucun produit.");
                }
                return List.copyOf(rows);
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Impossible de lire le catalogue CSV.");
        }
    }

    private Map<String, ImageAsset> readImages(MultipartFile images) {
        if (images == null || images.isEmpty()) {
            return Map.of();
        }
        Map<String, ImageAsset> assets = new LinkedHashMap<>();
        long totalBytes = 0;
        try (ZipInputStream zip = new ZipInputStream(images.getInputStream())) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (entry.isDirectory() || entry.getName().startsWith("__MACOSX/")) {
                    continue;
                }
                String normalizedPath = normalizeZipPath(entry.getName());
                String filename = basename(normalizedPath);
                String contentType = contentType(filename);
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                int read;
                while ((read = zip.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                    if (output.size() > MAX_IMAGE_BYTES) {
                        throw new IllegalArgumentException("Une image dépasse la limite de 10 Mo.");
                    }
                }
                totalBytes += output.size();
                if (totalBytes > MAX_UNCOMPRESSED_BYTES) {
                    throw new IllegalArgumentException("Le contenu décompressé dépasse 200 Mo.");
                }
                ImageAsset asset = new ImageAsset(filename, contentType, output.toByteArray());
                putUnique(assets, normalizedPath.toLowerCase(Locale.ROOT), asset);
                if (!normalizedPath.equals(filename)) {
                    putUnique(assets, filename.toLowerCase(Locale.ROOT), asset);
                }
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Impossible de lire l'archive ZIP d'images.");
        }
        return Map.copyOf(assets);
    }

    private void validateFiles(MultipartFile catalog, MultipartFile images) {
        if (catalog == null || catalog.isEmpty()) {
            throw new IllegalArgumentException("Le fichier CSV est obligatoire.");
        }
        if (catalog.getSize() > MAX_CSV_BYTES) {
            throw new IllegalArgumentException("Le fichier CSV ne doit pas dépasser 2 Mo.");
        }
        String catalogName = catalog.getOriginalFilename();
        if (catalogName == null || !catalogName.toLowerCase(Locale.ROOT).endsWith(".csv")) {
            throw new IllegalArgumentException("Le catalogue doit être un fichier CSV.");
        }
        if (images != null && !images.isEmpty()) {
            if (images.getSize() > MAX_ZIP_BYTES) {
                throw new IllegalArgumentException("L'archive ZIP ne doit pas dépasser 100 Mo.");
            }
            String imagesName = images.getOriginalFilename();
            if (imagesName == null || !imagesName.toLowerCase(Locale.ROOT).endsWith(".zip")) {
                throw new IllegalArgumentException("Les images doivent être fournies dans une archive ZIP.");
            }
        }
    }

    private Map<String, String> normalizeHeaders(Map<String, Integer> sourceHeaders) {
        Map<String, String> headers = new LinkedHashMap<>();
        sourceHeaders.keySet().forEach(header -> headers.put(
                header.trim().toLowerCase(Locale.ROOT), header
        ));
        return headers;
    }

    private char detectDelimiter(String csv) {
        String header = csv.lines().findFirst().orElse("");
        long commas = header.chars().filter(character -> character == ',').count();
        long semicolons = header.chars().filter(character -> character == ';').count();
        return semicolons > commas ? ';' : ',';
    }

    private void validateHeaders(Set<String> headers) {
        Set<String> required = Set.of("name", "price", "sku", "category", "image");
        if (!headers.containsAll(required)) {
            Set<String> missing = new HashSet<>(required);
            missing.removeAll(headers);
            throw new IllegalArgumentException("Colonnes CSV manquantes : " + String.join(", ", missing));
        }
    }

    private ProductRequest withImage(ProductRequest request, String imageUrl) {
        return new ProductRequest(
                request.name(), request.description(), request.price(), request.stockQuantity(), imageUrl,
                request.sku(), request.status(), request.categoryId(), request.audience(), request.variants()
        );
    }

    private ImageAsset findImage(Map<String, ImageAsset> images, String reference) {
        String key = normalizeZipPath(reference).toLowerCase(Locale.ROOT);
        ImageAsset image = images.get(key);
        if (image == null) {
            image = images.get(basename(key));
        }
        if (image == null) {
            throw new IllegalArgumentException("Image introuvable dans le ZIP : " + reference);
        }
        return image;
    }

    private String required(ImportRow row, String column) {
        String value = optional(row, column);
        if (value.isBlank()) {
            throw new IllegalArgumentException("La colonne " + column + " est obligatoire.");
        }
        return value;
    }

    private String optional(ImportRow row, String column) {
        return row.values().getOrDefault(column, "").trim();
    }

    private BigDecimal decimal(ImportRow row, String column) {
        try {
            BigDecimal value = new BigDecimal(required(row, column).replace(',', '.'));
            if (value.signum() < 0) {
                throw new NumberFormatException();
            }
            return value;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("La colonne " + column + " doit contenir un montant positif.");
        }
    }

    private int nonNegativeInteger(ImportRow row, String column, boolean required) {
        String raw = optional(row, column);
        if (raw.isBlank()) {
            if (required) {
                throw new IllegalArgumentException("La colonne " + column + " est obligatoire sans stock par taille.");
            }
            return 0;
        }
        try {
            int value = Integer.parseInt(raw);
            if (value < 0) {
                throw new NumberFormatException();
            }
            return value;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("La colonne " + column + " doit être un entier positif.");
        }
    }

    private <T extends Enum<T>> T enumValue(ImportRow row, String column, Class<T> type, T fallback) {
        String raw = optional(row, column);
        if (raw.isBlank()) {
            return fallback;
        }
        try {
            return Enum.valueOf(type, raw.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Valeur invalide pour " + column + " : " + raw);
        }
    }

    private String normalizeZipPath(String path) {
        String normalized = path.replace('\\', '/').replaceFirst("^/+", "");
        if (normalized.isBlank() || normalized.contains("../") || normalized.equals("..")) {
            throw new IllegalArgumentException("Chemin d'image ZIP invalide.");
        }
        return normalized;
    }

    private String basename(String path) {
        int separator = path.lastIndexOf('/');
        return separator >= 0 ? path.substring(separator + 1) : path;
    }

    private String contentType(String filename) {
        String lowered = filename.toLowerCase(Locale.ROOT);
        if (lowered.endsWith(".jpg") || lowered.endsWith(".jpeg")) return "image/jpeg";
        if (lowered.endsWith(".png")) return "image/png";
        if (lowered.endsWith(".webp")) return "image/webp";
        throw new IllegalArgumentException("Format image non autorisé dans le ZIP : " + filename);
    }

    private void putUnique(Map<String, ImageAsset> assets, String key, ImageAsset asset) {
        if (assets.putIfAbsent(key, asset) != null) {
            throw new IllegalArgumentException("Nom d'image dupliqué ou ambigu dans le ZIP : " + key);
        }
    }

    private ProductImportRowResponse result(ImportRow row, String status, Long productId, String message) {
        return new ProductImportRowResponse(
                row.rowNumber(), optional(row, "sku"), optional(row, "name"), status, productId, message
        );
    }

    private String safeMessage(RuntimeException exception) {
        String message = exception.getMessage();
        return message == null || message.isBlank() ? "Import impossible pour cette ligne." : message;
    }

    private record ImportRow(int rowNumber, Map<String, String> values) {}
    private record ImageAsset(String filename, String contentType, byte[] bytes) {}
    private record PreparedProduct(ProductRequest request, String imageUrl, ImageAsset imageAsset) {}
}
