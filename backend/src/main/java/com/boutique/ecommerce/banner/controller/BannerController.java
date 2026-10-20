package com.boutique.ecommerce.banner.controller;

import com.boutique.ecommerce.banner.dto.BannerResponse;
import com.boutique.ecommerce.banner.entity.BannerPlacement;
import com.boutique.ecommerce.banner.service.BannerService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/banners")
public class BannerController {

    private final BannerService bannerService;

    public BannerController(BannerService bannerService) {
        this.bannerService = bannerService;
    }

    @GetMapping
    public List<BannerResponse> getBanners(@RequestParam BannerPlacement placement) {
        return bannerService.getPublicBanners(placement);
    }
}
