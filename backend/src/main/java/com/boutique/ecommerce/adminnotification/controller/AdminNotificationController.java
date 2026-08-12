package com.boutique.ecommerce.adminnotification.controller;

import com.boutique.ecommerce.adminnotification.dto.AdminNotificationPageResponse;
import com.boutique.ecommerce.adminnotification.dto.AdminNotificationResponse;
import com.boutique.ecommerce.adminnotification.service.AdminNotificationService;
import com.boutique.ecommerce.adminnotification.service.AdminNotificationStreamService;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final AdminNotificationService notificationService;
    private final AdminNotificationStreamService streamService;

    public AdminNotificationController(
            AdminNotificationService notificationService,
            AdminNotificationStreamService streamService
    ) {
        this.notificationService = notificationService;
        this.streamService = streamService;
    }

    @GetMapping
    public AdminNotificationPageResponse getLatest(@RequestParam(defaultValue = "12") int limit) {
        return notificationService.getLatest(limit);
    }

    @PatchMapping("/{id}/read")
    public AdminNotificationResponse markRead(@PathVariable Long id) {
        return notificationService.markRead(id);
    }

    @PatchMapping("/read-all")
    public void markAllRead() {
        notificationService.markAllRead();
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return streamService.subscribe();
    }
}
