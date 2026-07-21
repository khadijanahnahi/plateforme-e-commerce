package com.boutique.ecommerce.blog.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

@Component
public class BlogContentService {
    private static final int WORDS_PER_MINUTE = 220;
    private final ObjectMapper objectMapper;

    public BlogContentService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String validateJson(String contentJson) {
        try {
            objectMapper.readTree(contentJson);
            return contentJson;
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Editorial content must be valid JSON.");
        }
    }

    public String sanitizeHtml(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        Safelist safelist = Safelist.relaxed()
                .addTags("h2", "h3", "hr")
                .addAttributes("a", "target", "rel")
                .addAttributes("img", "alt", "width", "height")
                .addProtocols("a", "href", "http", "https", "mailto")
                .addProtocols("img", "src", "http", "https");
        return Jsoup.clean(html, safelist);
    }

    public int readingTimeMinutes(String html) {
        String text = Jsoup.parse(html == null ? "" : html).text().trim();
        if (text.isBlank()) {
            return 1;
        }
        int words = text.split("\\s+").length;
        return Math.max(1, (int) Math.ceil(words / (double) WORDS_PER_MINUTE));
    }
}
