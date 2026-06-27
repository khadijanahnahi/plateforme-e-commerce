package com.boutique.ecommerce.upload.controller;

import com.boutique.ecommerce.upload.dto.UploadResponse;
import com.boutique.ecommerce.upload.service.UploadService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/uploads")
public class AdminUploadController {

    private final UploadService uploadService;

    public AdminUploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping(value = "/product-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadResponse uploadProductImage(@RequestParam("file") MultipartFile file) {
        return uploadService.uploadProductImage(file);
    }
}
