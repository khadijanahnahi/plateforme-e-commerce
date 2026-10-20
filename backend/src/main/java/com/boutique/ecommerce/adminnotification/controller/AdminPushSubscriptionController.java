package com.boutique.ecommerce.adminnotification.controller;

import com.boutique.ecommerce.adminnotification.dto.PushEndpointRequest;
import com.boutique.ecommerce.adminnotification.dto.PushSubscriptionRequest;
import com.boutique.ecommerce.adminnotification.dto.PushSubscriptionStatusResponse;
import com.boutique.ecommerce.adminnotification.service.PushSubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/push-subscriptions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPushSubscriptionController {

    private final PushSubscriptionService subscriptionService;

    public AdminPushSubscriptionController(PushSubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/status")
    public PushSubscriptionStatusResponse getStatus() {
        return subscriptionService.getStatus();
    }

    @PostMapping
    public PushSubscriptionStatusResponse subscribe(
            @Valid @RequestBody PushSubscriptionRequest request,
            HttpServletRequest servletRequest
    ) {
        return subscriptionService.subscribe(request, servletRequest.getHeader("User-Agent"));
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@Valid @RequestBody PushEndpointRequest request) {
        subscriptionService.unsubscribe(request);
    }
}
