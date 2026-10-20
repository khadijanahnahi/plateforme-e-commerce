package com.boutique.ecommerce.support.controller;

import com.boutique.ecommerce.support.dto.SupportMessageResponse;
import com.boutique.ecommerce.support.dto.UpdateSupportMessageNoteRequest;
import com.boutique.ecommerce.support.dto.UpdateSupportMessageStatusRequest;
import com.boutique.ecommerce.support.entity.SupportMessageStatus;
import com.boutique.ecommerce.support.service.SupportMessageService;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/support-messages")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSupportMessageController {

    private final SupportMessageService supportMessageService;

    public AdminSupportMessageController(SupportMessageService supportMessageService) {
        this.supportMessageService = supportMessageService;
    }

    @GetMapping
    public List<SupportMessageResponse> getMessages(
            @RequestParam(required = false) SupportMessageStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo
    ) {
        return supportMessageService.getMessages(status, search, dateFrom, dateTo);
    }

    @GetMapping("/{id}")
    public SupportMessageResponse getById(@PathVariable Long id) {
        return supportMessageService.getById(id);
    }

    @PatchMapping("/{id}/status")
    public SupportMessageResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupportMessageStatusRequest request
    ) {
        return supportMessageService.updateStatus(id, request);
    }

    @PatchMapping("/{id}/note")
    public SupportMessageResponse updateNote(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupportMessageNoteRequest request
    ) {
        return supportMessageService.updateNote(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        supportMessageService.delete(id);
    }
}
