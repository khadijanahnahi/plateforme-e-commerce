package com.boutique.ecommerce.blog.controller;

import com.boutique.ecommerce.blog.dto.BlogFeatureRequest;
import com.boutique.ecommerce.blog.dto.BlogPostRequest;
import com.boutique.ecommerce.blog.dto.BlogPostResponse;
import com.boutique.ecommerce.blog.dto.BlogPostSummaryResponse;
import com.boutique.ecommerce.blog.dto.BlogScheduleRequest;
import com.boutique.ecommerce.blog.entity.BlogPostStatus;
import com.boutique.ecommerce.blog.service.BlogPostService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
@RequestMapping("/api/admin/blog/posts")
public class AdminBlogPostController {
    private final BlogPostService service;
    public AdminBlogPostController(BlogPostService service) { this.service = service; }

    @GetMapping
    public Page<BlogPostSummaryResponse> posts(@RequestParam(required = false) String search,
                                               @RequestParam(required = false) BlogPostStatus status,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size,
                                               @RequestParam(defaultValue = "updatedAt") String sort) {
        return service.adminPosts(search, status, page, size, sort);
    }

    @GetMapping("/{id}") public BlogPostResponse post(@PathVariable Long id) { return service.adminPost(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public BlogPostResponse create(@Valid @RequestBody BlogPostRequest request, Authentication authentication) { return service.create(request, authentication); }
    @PutMapping("/{id}") public BlogPostResponse update(@PathVariable Long id, @Valid @RequestBody BlogPostRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id) { service.delete(id); }
    @PatchMapping("/{id}/publish") public BlogPostResponse publish(@PathVariable Long id) { return service.publish(id); }
    @PatchMapping("/{id}/schedule") public BlogPostResponse schedule(@PathVariable Long id, @Valid @RequestBody BlogScheduleRequest request) { return service.schedule(id, request); }
    @PatchMapping("/{id}/archive") public BlogPostResponse archive(@PathVariable Long id) { return service.archive(id); }
    @PatchMapping("/{id}/feature") public BlogPostResponse feature(@PathVariable Long id, @RequestBody BlogFeatureRequest request) { return service.feature(id, request); }
}
