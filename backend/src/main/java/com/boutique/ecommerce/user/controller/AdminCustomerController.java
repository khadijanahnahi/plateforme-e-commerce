package com.boutique.ecommerce.user.controller;

import com.boutique.ecommerce.user.dto.AdminCustomerResponse;
import com.boutique.ecommerce.user.service.AdminCustomerService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/customers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCustomerController {

    private final AdminCustomerService adminCustomerService;

    public AdminCustomerController(AdminCustomerService adminCustomerService) {
        this.adminCustomerService = adminCustomerService;
    }

    @GetMapping
    public List<AdminCustomerResponse> getCustomers() {
        return adminCustomerService.getCustomers();
    }
}
