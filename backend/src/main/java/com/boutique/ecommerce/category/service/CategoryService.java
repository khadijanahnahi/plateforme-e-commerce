package com.boutique.ecommerce.category.service;

import com.boutique.ecommerce.category.dto.CategoryRequest;
import com.boutique.ecommerce.category.dto.CategoryResponse;
import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.product.repository.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllActive() {
        return categoryRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getActiveById(Long id) {
        Category category = categoryRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Active category not found."));
        return toResponse(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String name = normalizeName(request.name());
        validateUniqueName(name, null);

        Category category = Category.builder()
                .name(name)
                .description(normalizeDescription(request.description()))
                .imageUrl(normalizeImageUrl(request.imageUrl()))
                .active(request.active() == null || request.active())
                .build();

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = findById(id);
        String name = normalizeName(request.name());
        validateUniqueName(name, id);

        category.setName(name);
        category.setDescription(normalizeDescription(request.description()));
        category.setImageUrl(normalizeImageUrl(request.imageUrl()));
        if (request.active() != null) {
            category.setActive(request.active());
        }

        return toResponse(category);
    }

    @Transactional
    public CategoryResponse deactivate(Long id) {
        Category category = findById(id);
        category.setActive(false);
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse activate(Long id) {
        Category category = findById(id);
        category.setActive(true);
        return toResponse(category);
    }

    private Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found."));
    }

    private void validateUniqueName(String name, Long currentCategoryId) {
        categoryRepository.findByNameIgnoreCase(name)
                .filter(category -> currentCategoryId == null || !category.getId().equals(currentCategoryId))
                .ifPresent(category -> {
                    throw new ResourceConflictException("Category name already exists.");
                });
    }

    private String normalizeName(String name) {
        return name.trim();
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }

    private String normalizeImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        return imageUrl.trim();
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getImageUrl(),
                category.isActive(),
                productRepository.countByCategoryId(category.getId()),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
