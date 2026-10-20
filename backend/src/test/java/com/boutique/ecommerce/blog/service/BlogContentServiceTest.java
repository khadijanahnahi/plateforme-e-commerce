package com.boutique.ecommerce.blog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashSet;
import org.junit.jupiter.api.Test;

class BlogContentServiceTest {
    private final BlogContentService contentService = new BlogContentService(new ObjectMapper());
    private final BlogSlugService slugService = new BlogSlugService();

    @Test
    void sanitizesDangerousHtmlAndKeepsEditorialMarkup() {
        String sanitized = contentService.sanitizeHtml("""
                <h2>Conseil</h2><script>alert('xss')</script>
                <p onclick="steal()">Texte <strong>important</strong></p>
                <a href="javascript:alert(1)">danger</a>
                <img src="data:text/html;base64,Zm9v" onerror="steal()">
                """);

        assertThat(sanitized).contains("<h2>Conseil</h2>", "<strong>important</strong>");
        assertThat(sanitized).doesNotContain("script", "onclick", "javascript:", "onerror", "data:text");
    }

    @Test
    void validatesJsonAndComputesReadingTime() {
        assertThat(contentService.validateJson("{\"type\":\"doc\"}")).contains("doc");
        assertThatThrownBy(() -> contentService.validateJson("{invalid"))
                .isInstanceOf(IllegalArgumentException.class);

        String text = "mot ".repeat(221);
        assertThat(contentService.readingTimeMinutes("<p>" + text + "</p>")).isEqualTo(2);
    }

    @Test
    void createsAccentFreeUniqueSlugs() {
        HashSet<String> existing = new HashSet<>();
        existing.add("elegance-du-quotidien");

        assertThat(slugService.slugify("Élégance du quotidien !")).isEqualTo("elegance-du-quotidien");
        assertThat(slugService.uniqueSlug("Élégance du quotidien", existing::contains))
                .isEqualTo("elegance-du-quotidien-2");
    }
}
