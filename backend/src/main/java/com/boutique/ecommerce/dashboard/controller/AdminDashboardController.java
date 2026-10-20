package com.boutique.ecommerce.dashboard.controller;

import com.boutique.ecommerce.dashboard.dto.DashboardPeriod;
import com.boutique.ecommerce.dashboard.dto.DashboardStatsResponse;
import com.boutique.ecommerce.dashboard.service.DashboardService;
import java.util.Locale;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    public AdminDashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public DashboardStatsResponse getStats(@RequestParam(defaultValue = "all") String period) {
        return dashboardService.getStats(parsePeriod(period));
    }

    private DashboardPeriod parsePeriod(String period) {
        return DashboardPeriod.valueOf(period.trim().toUpperCase(Locale.ROOT));
    }
}
