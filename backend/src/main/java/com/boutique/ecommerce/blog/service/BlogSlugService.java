package com.boutique.ecommerce.blog.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;
import org.springframework.stereotype.Component;

@Component
public class BlogSlugService {
    public String uniqueSlug(String value, Predicate<String> alreadyExists) {
        String base = slugify(value);
        String candidate = base;
        int suffix = 2;
        while (alreadyExists.test(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    public String slugify(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("A valid slug cannot be generated from this value.");
        }
        return normalized.substring(0, Math.min(normalized.length(), 220));
    }
}
