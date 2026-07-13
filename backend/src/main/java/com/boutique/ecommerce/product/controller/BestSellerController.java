package com.boutique.ecommerce.product.controller;

import com.boutique.ecommerce.product.dto.BestSellerResponse;
import com.boutique.ecommerce.product.service.BestSellerService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products/best-sellers")
public class BestSellerController {

    private final BestSellerService bestSellerService;

    public BestSellerController(BestSellerService bestSellerService) {
        this.bestSellerService = bestSellerService;
    }

    @GetMapping
    public List<BestSellerResponse> getBestSellers(@RequestParam(defaultValue = "8") int limit) {
        return bestSellerService.getBestSellers(limit);
    }
}
