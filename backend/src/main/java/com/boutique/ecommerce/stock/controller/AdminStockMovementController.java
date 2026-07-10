package com.boutique.ecommerce.stock.controller;

import com.boutique.ecommerce.stock.dto.StockMovementResponse;
import com.boutique.ecommerce.stock.entity.StockMovementType;
import com.boutique.ecommerce.stock.service.StockMovementService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin")
public class AdminStockMovementController {

    private final StockMovementService movementService;

    public AdminStockMovementController(StockMovementService movementService) {
        this.movementService = movementService;
    }

    @GetMapping("/stock-movements")
    public List<StockMovementResponse> getMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) StockMovementType movementType,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo
    ) {
        return movementService.getMovements(productId, movementType, orderId, dateFrom, dateTo);
    }

    @GetMapping("/products/{productId}/stock-movements")
    public List<StockMovementResponse> getProductMovements(@PathVariable Long productId) {
        return movementService.getMovements(productId, null, null, null, null);
    }
}
