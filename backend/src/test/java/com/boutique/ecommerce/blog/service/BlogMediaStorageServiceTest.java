package com.boutique.ecommerce.blog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.boutique.ecommerce.blog.config.BlogStorageProperties;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class BlogMediaStorageServiceTest {
    @TempDir Path storage;

    @Test
    void storesReadsAndDeletesAValidatedImage() {
        BlogMediaStorageService service = service();
        byte[] png = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3};

        var uploaded = service.upload("covers", new MockMultipartFile("file", "cover.png", "image/png", png));

        assertThat(uploaded.key()).matches("blog/covers/[a-f0-9-]+\\.png");
        assertThat(service.read("covers", uploaded.key().substring("blog/covers/".length())).bytes()).isEqualTo(png);
        service.delete(uploaded.key());
        assertThatThrownBy(() -> service.read("covers", uploaded.key().substring("blog/covers/".length())))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void rejectsSpoofedMimeTypeAndInvalidScope() {
        BlogMediaStorageService service = service();
        MockMultipartFile spoofed = new MockMultipartFile("file", "attack.png", "image/png", "not-an-image".getBytes());

        assertThatThrownBy(() -> service.upload("covers", spoofed))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not match");
        assertThatThrownBy(() -> service.upload("../outside", spoofed))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("scope");
    }

    private BlogMediaStorageService service() {
        BlogStorageProperties properties = new BlogStorageProperties();
        properties.setStorageProvider("local");
        properties.setLocalPath(storage.toString());
        properties.setMaxImageSize(1024);
        return new BlogMediaStorageService(properties);
    }
}
