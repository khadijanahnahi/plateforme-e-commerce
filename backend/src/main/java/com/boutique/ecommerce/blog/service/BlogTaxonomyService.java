package com.boutique.ecommerce.blog.service;

import com.boutique.ecommerce.blog.dto.BlogCategoryRequest;
import com.boutique.ecommerce.blog.dto.BlogCategoryResponse;
import com.boutique.ecommerce.blog.dto.BlogTagRequest;
import com.boutique.ecommerce.blog.dto.BlogTagResponse;
import com.boutique.ecommerce.blog.entity.BlogCategory;
import com.boutique.ecommerce.blog.entity.BlogTag;
import com.boutique.ecommerce.blog.repository.BlogCategoryRepository;
import com.boutique.ecommerce.blog.repository.BlogPostRepository;
import com.boutique.ecommerce.blog.repository.BlogTagRepository;
import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlogTaxonomyService {
    private final BlogCategoryRepository categoryRepository;
    private final BlogTagRepository tagRepository;
    private final BlogPostRepository postRepository;
    private final BlogSlugService slugService;

    public BlogTaxonomyService(BlogCategoryRepository categoryRepository, BlogTagRepository tagRepository,
                               BlogPostRepository postRepository, BlogSlugService slugService) {
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.postRepository = postRepository;
        this.slugService = slugService;
    }

    @Transactional(readOnly = true)
    public List<BlogCategoryResponse> categories() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BlogTagResponse> tags() {
        return tagRepository.findAllByOrderByNameAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public BlogCategoryResponse createCategory(BlogCategoryRequest request) {
        String name = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) throw new ResourceConflictException("Blog category already exists.");
        BlogCategory category = new BlogCategory();
        category.setName(name);
        category.setSlug(slugService.uniqueSlug(name, categoryRepository::existsBySlug));
        category.setDescription(normalize(request.description()));
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public BlogCategoryResponse updateCategory(Long id, BlogCategoryRequest request) {
        BlogCategory category = categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Blog category not found."));
        String name = request.name().trim();
        if (!category.getName().equalsIgnoreCase(name) && categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ResourceConflictException("Blog category already exists.");
        }
        category.setName(name);
        category.setDescription(normalize(request.description()));
        return toResponse(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (postRepository.existsByCategoryId(id)) throw new ResourceConflictException("Category is used by blog posts.");
        if (!categoryRepository.existsById(id)) throw new ResourceNotFoundException("Blog category not found.");
        categoryRepository.deleteById(id);
    }

    @Transactional
    public BlogTagResponse createTag(BlogTagRequest request) {
        String name = request.name().trim();
        if (tagRepository.existsByNameIgnoreCase(name)) throw new ResourceConflictException("Blog tag already exists.");
        BlogTag tag = new BlogTag();
        tag.setName(name);
        tag.setSlug(slugService.uniqueSlug(name, tagRepository::existsBySlug));
        return toResponse(tagRepository.save(tag));
    }

    @Transactional
    public BlogTagResponse updateTag(Long id, BlogTagRequest request) {
        BlogTag tag = tagRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Blog tag not found."));
        String name = request.name().trim();
        if (!tag.getName().equalsIgnoreCase(name) && tagRepository.existsByNameIgnoreCase(name)) {
            throw new ResourceConflictException("Blog tag already exists.");
        }
        tag.setName(name);
        return toResponse(tag);
    }

    @Transactional
    public void deleteTag(Long id) {
        if (postRepository.existsByTagsId(id)) throw new ResourceConflictException("Tag is used by blog posts.");
        if (!tagRepository.existsById(id)) throw new ResourceNotFoundException("Blog tag not found.");
        tagRepository.deleteById(id);
    }

    BlogCategoryResponse toResponse(BlogCategory category) {
        return category == null ? null : new BlogCategoryResponse(category.getId(), category.getName(), category.getSlug(), category.getDescription());
    }

    BlogTagResponse toResponse(BlogTag tag) {
        return new BlogTagResponse(tag.getId(), tag.getName(), tag.getSlug());
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
