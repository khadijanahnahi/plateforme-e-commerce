package com.boutique.ecommerce.support.controller;

import com.boutique.ecommerce.support.dto.SupportMessageRequest;
import com.boutique.ecommerce.support.dto.SupportMessageResponse;
import com.boutique.ecommerce.support.service.SupportMessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support-messages")
public class SupportMessageController {

    private final SupportMessageService supportMessageService;

    public SupportMessageController(SupportMessageService supportMessageService) {
        this.supportMessageService = supportMessageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupportMessageResponse create(@Valid @RequestBody SupportMessageRequest request) {
        return supportMessageService.create(request);
    }
}
