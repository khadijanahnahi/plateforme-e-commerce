package com.boutique.ecommerce.promotion.controller;

import com.boutique.ecommerce.promotion.dto.PromotionRequest;
import com.boutique.ecommerce.promotion.dto.PromotionResponse;
import com.boutique.ecommerce.promotion.entity.PromotionStatus;
import com.boutique.ecommerce.promotion.entity.PromotionType;
import com.boutique.ecommerce.promotion.service.PromotionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/promotions")
public class AdminPromotionController {

    private final PromotionService promotionService;

    public AdminPromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @GetMapping
    public List<PromotionResponse> getPromotions(
            @RequestParam(required = false) PromotionStatus status,
            @RequestParam(required = false) PromotionType type,
            @RequestParam(required = false) Long productId,
            @RequestParam(defaultValue = "false") boolean activeOnly
    ) {
        return promotionService.getPromotionsForAdmin(status, type, productId, activeOnly);
    }

    @GetMapping("/{id}")
    public PromotionResponse getById(@PathVariable Long id) {
        return promotionService.getByIdForAdmin(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromotionResponse create(@Valid @RequestBody PromotionRequest request) {
        return promotionService.create(request);
    }

    @PutMapping("/{id}")
    public PromotionResponse update(@PathVariable Long id, @Valid @RequestBody PromotionRequest request) {
        return promotionService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    public PromotionResponse activate(@PathVariable Long id) {
        return promotionService.activate(id);
    }

    @PatchMapping("/{id}/deactivate")
    public PromotionResponse deactivate(@PathVariable Long id) {
        return promotionService.deactivate(id);
    }

    @PatchMapping("/{id}/expire")
    public PromotionResponse expire(@PathVariable Long id) {
        return promotionService.expire(id);
    }

    @DeleteMapping("/{id}")
    public PromotionResponse delete(@PathVariable Long id) {
        return promotionService.delete(id);
    }
}
