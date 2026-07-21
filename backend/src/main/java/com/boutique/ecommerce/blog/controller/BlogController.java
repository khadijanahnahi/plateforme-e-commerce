package com.boutique.ecommerce.blog.controller;

import com.boutique.ecommerce.blog.dto.BlogCategoryResponse;
import com.boutique.ecommerce.blog.dto.BlogPostResponse;
import com.boutique.ecommerce.blog.dto.BlogPostSummaryResponse;
import com.boutique.ecommerce.blog.dto.BlogTagResponse;
import com.boutique.ecommerce.blog.service.BlogPostService;
import com.boutique.ecommerce.blog.service.BlogTaxonomyService;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/blog")
public class BlogController {
    private final BlogPostService postService;
    private final BlogTaxonomyService taxonomyService;

    public BlogController(BlogPostService postService, BlogTaxonomyService taxonomyService) {
        this.postService = postService;
        this.taxonomyService = taxonomyService;
    }

    @GetMapping("/posts")
    public Page<BlogPostSummaryResponse> posts(@RequestParam(required = false) String search,
                                               @RequestParam(required = false) String category,
                                               @RequestParam(required = false) String tag,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "9") int size,
                                               @RequestParam(defaultValue = "publishedAt") String sort) {
        return postService.publicPosts(search, category, tag, page, size, sort);
    }

    @GetMapping("/posts/{slug}")
    public BlogPostResponse post(@PathVariable String slug) { return postService.publicPost(slug); }

    @GetMapping("/posts/featured")
    public List<BlogPostSummaryResponse> featured(@RequestParam(defaultValue = "3") int limit) { return postService.featured(limit); }

    @GetMapping("/posts/latest")
    public List<BlogPostSummaryResponse> latest(@RequestParam(defaultValue = "3") int limit) { return postService.latest(limit); }

    @GetMapping("/categories")
    public List<BlogCategoryResponse> categories() { return taxonomyService.categories(); }

    @GetMapping("/tags")
    public List<BlogTagResponse> tags() { return taxonomyService.tags(); }

    @GetMapping("/categories/{slug}/posts")
    public Page<BlogPostSummaryResponse> categoryPosts(@PathVariable String slug,
                                                       @RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "9") int size) {
        return postService.publicPosts(null, slug, null, page, size, "publishedAt");
    }

    @GetMapping("/tags/{slug}/posts")
    public Page<BlogPostSummaryResponse> tagPosts(@PathVariable String slug,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "9") int size) {
        return postService.publicPosts(null, null, slug, page, size, "publishedAt");
    }
}
