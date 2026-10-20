package com.boutique.ecommerce.returnrequest.controller;

import com.boutique.ecommerce.returnrequest.dto.ReturnRequestResponse;
import com.boutique.ecommerce.returnrequest.dto.UpdateReturnRequestStatus;
import com.boutique.ecommerce.returnrequest.service.ReturnRequestService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/return-requests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReturnRequestController {

    private final ReturnRequestService returnRequestService;

    public AdminReturnRequestController(ReturnRequestService returnRequestService) {
        this.returnRequestService = returnRequestService;
    }

    @GetMapping
    public List<ReturnRequestResponse> getAll() {
        return returnRequestService.getAllForAdmin();
    }

    @PatchMapping("/{id}/status")
    public ReturnRequestResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateReturnRequestStatus request
    ) {
        return returnRequestService.updateStatusForAdmin(id, request);
    }
}
