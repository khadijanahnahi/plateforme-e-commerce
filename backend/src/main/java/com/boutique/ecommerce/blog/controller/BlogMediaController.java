package com.boutique.ecommerce.blog.controller;

import com.boutique.ecommerce.blog.service.BlogMediaStorageService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/blog/media")
public class BlogMediaController {
    private final BlogMediaStorageService storageService;

    public BlogMediaController(BlogMediaStorageService storageService) { this.storageService = storageService; }

    @GetMapping("/{scope}/{filename:.+}")
    public ResponseEntity<byte[]> media(@PathVariable String scope, @PathVariable String filename) {
        var file = storageService.read(scope, filename);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(7)).cachePublic())
                .contentType(MediaType.parseMediaType(file.contentType()))
                .body(file.bytes());
    }
}
