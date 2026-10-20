package com.boutique.ecommerce.wishlist.controller;

import com.boutique.ecommerce.wishlist.dto.WishlistItemResponse;
import com.boutique.ecommerce.wishlist.service.WishlistService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wishlist")
@PreAuthorize("isAuthenticated()")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public List<WishlistItemResponse> getWishlist() {
        return wishlistService.getWishlist();
    }

    @PostMapping("/{productId}")
    @ResponseStatus(HttpStatus.CREATED)
    public WishlistItemResponse addProduct(@PathVariable Long productId) {
        return wishlistService.addProduct(productId);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeProduct(@PathVariable Long productId) {
        wishlistService.removeProduct(productId);
    }

    @GetMapping("/{productId}/exists")
    public boolean exists(@PathVariable Long productId) {
        return wishlistService.exists(productId);
    }
}
