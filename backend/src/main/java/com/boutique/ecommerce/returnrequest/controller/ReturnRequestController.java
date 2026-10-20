package com.boutique.ecommerce.returnrequest.controller;

import com.boutique.ecommerce.returnrequest.dto.CreateReturnRequest;
import com.boutique.ecommerce.returnrequest.dto.EligibleReturnItemResponse;
import com.boutique.ecommerce.returnrequest.dto.ReturnRequestResponse;
import com.boutique.ecommerce.returnrequest.service.ReturnRequestService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/return-requests")
public class ReturnRequestController {

    private final ReturnRequestService returnRequestService;

    public ReturnRequestController(ReturnRequestService returnRequestService) {
        this.returnRequestService = returnRequestService;
    }

    @GetMapping("/eligible-items")
    public List<EligibleReturnItemResponse> getEligibleItems() {
        return returnRequestService.getEligibleItems();
    }

    @GetMapping
    public List<ReturnRequestResponse> getMyRequests() {
        return returnRequestService.getMyRequests();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReturnRequestResponse create(@Valid @RequestBody CreateReturnRequest request) {
        return returnRequestService.create(request);
    }

    @PatchMapping("/{id}/cancel")
    public ReturnRequestResponse cancel(@PathVariable Long id) {
        return returnRequestService.cancelOwnRequest(id);
    }
}
