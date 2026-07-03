package com.boutique.ecommerce.promotion.controller;

import com.boutique.ecommerce.promotion.dto.PromotionProductResponse;
import com.boutique.ecommerce.promotion.dto.PromotionResponse;
import com.boutique.ecommerce.promotion.service.PromotionService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @GetMapping("/active")
    public List<PromotionResponse> getActivePromotions() {
        return promotionService.getActivePromotions();
    }

    @GetMapping("/flash-sale")
    public List<PromotionProductResponse> getFlashSales() {
        return promotionService.getActiveFlashSales();
    }
}
