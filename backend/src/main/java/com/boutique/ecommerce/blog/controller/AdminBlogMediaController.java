package com.boutique.ecommerce.blog.controller;

import com.boutique.ecommerce.blog.dto.BlogMediaUploadResponse;
import com.boutique.ecommerce.blog.service.BlogMediaStorageService;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/blog/media")
public class AdminBlogMediaController {
    private final BlogMediaStorageService storageService;
    public AdminBlogMediaController(BlogMediaStorageService storageService) { this.storageService = storageService; }

    @PostMapping(value = "/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BlogMediaUploadResponse cover(@RequestParam("file") MultipartFile file) { return storageService.upload("covers", file); }

    @PostMapping(value = "/content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BlogMediaUploadResponse content(@RequestParam("file") MultipartFile file) { return storageService.upload("content", file); }
}
