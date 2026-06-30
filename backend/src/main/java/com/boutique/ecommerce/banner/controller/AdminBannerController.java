package com.boutique.ecommerce.banner.controller;

import com.boutique.ecommerce.banner.dto.BannerRequest;
import com.boutique.ecommerce.banner.dto.BannerResponse;
import com.boutique.ecommerce.banner.service.BannerService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/banners")
public class AdminBannerController {

    private final BannerService bannerService;

    public AdminBannerController(BannerService bannerService) {
        this.bannerService = bannerService;
    }

    @GetMapping
    public List<BannerResponse> getAll() {
        return bannerService.getAll();
    }

    @GetMapping("/{id}")
    public BannerResponse getById(@PathVariable Long id) {
        return bannerService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BannerResponse create(@Valid @RequestBody BannerRequest request) {
        return bannerService.create(request);
    }

    @PutMapping("/{id}")
    public BannerResponse update(@PathVariable Long id, @Valid @RequestBody BannerRequest request) {
        return bannerService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    public BannerResponse activate(@PathVariable Long id) {
        return bannerService.activate(id);
    }

    @PatchMapping("/{id}/deactivate")
    public BannerResponse deactivate(@PathVariable Long id) {
        return bannerService.deactivate(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        bannerService.delete(id);
    }
}
