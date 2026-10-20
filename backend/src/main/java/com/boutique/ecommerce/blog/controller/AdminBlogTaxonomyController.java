package com.boutique.ecommerce.blog.controller;

import com.boutique.ecommerce.blog.dto.BlogCategoryRequest;
import com.boutique.ecommerce.blog.dto.BlogCategoryResponse;
import com.boutique.ecommerce.blog.dto.BlogTagRequest;
import com.boutique.ecommerce.blog.dto.BlogTagResponse;
import com.boutique.ecommerce.blog.service.BlogTaxonomyService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/blog")
public class AdminBlogTaxonomyController {
    private final BlogTaxonomyService service;
    public AdminBlogTaxonomyController(BlogTaxonomyService service) { this.service = service; }

    @GetMapping("/categories") public List<BlogCategoryResponse> categories() { return service.categories(); }
    @PostMapping("/categories") @ResponseStatus(HttpStatus.CREATED) public BlogCategoryResponse createCategory(@Valid @RequestBody BlogCategoryRequest request) { return service.createCategory(request); }
    @PutMapping("/categories/{id}") public BlogCategoryResponse updateCategory(@PathVariable Long id, @Valid @RequestBody BlogCategoryRequest request) { return service.updateCategory(id, request); }
    @DeleteMapping("/categories/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteCategory(@PathVariable Long id) { service.deleteCategory(id); }

    @GetMapping("/tags") public List<BlogTagResponse> tags() { return service.tags(); }
    @PostMapping("/tags") @ResponseStatus(HttpStatus.CREATED) public BlogTagResponse createTag(@Valid @RequestBody BlogTagRequest request) { return service.createTag(request); }
    @PutMapping("/tags/{id}") public BlogTagResponse updateTag(@PathVariable Long id, @Valid @RequestBody BlogTagRequest request) { return service.updateTag(id, request); }
    @DeleteMapping("/tags/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteTag(@PathVariable Long id) { service.deleteTag(id); }
}
