package com.boutique.ecommerce.blog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.boutique.ecommerce.blog.dto.BlogCategoryRequest;
import com.boutique.ecommerce.blog.dto.BlogTagRequest;
import com.boutique.ecommerce.blog.entity.BlogCategory;
import com.boutique.ecommerce.blog.entity.BlogTag;
import com.boutique.ecommerce.blog.repository.BlogCategoryRepository;
import com.boutique.ecommerce.blog.repository.BlogPostRepository;
import com.boutique.ecommerce.blog.repository.BlogTagRepository;
import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BlogTaxonomyServiceTest {

    @Mock
    private BlogCategoryRepository categoryRepository;
    @Mock
    private BlogTagRepository tagRepository;
    @Mock
    private BlogPostRepository postRepository;
    @Mock
    private BlogSlugService slugService;

    private BlogTaxonomyService service;

    @BeforeEach
    void setUp() {
        service = new BlogTaxonomyService(categoryRepository, tagRepository, postRepository, slugService);
    }

    @Test
    void listsCategoriesAndTagsAsResponses() {
        BlogCategory category = category(1L, "Conseils", "conseils", "Guides premium");
        BlogTag tag = tag(2L, "Minimalisme", "minimalisme");
        when(categoryRepository.findAllByOrderByNameAsc()).thenReturn(List.of(category));
        when(tagRepository.findAllByOrderByNameAsc()).thenReturn(List.of(tag));

        assertThat(service.categories()).singleElement().satisfies(response -> {
            assertThat(response.id()).isEqualTo(1L);
            assertThat(response.description()).isEqualTo("Guides premium");
        });
        assertThat(service.tags()).singleElement().satisfies(response -> {
            assertThat(response.id()).isEqualTo(2L);
            assertThat(response.name()).isEqualTo("Minimalisme");
        });
    }

    @Test
    void createsNormalizedCategoryWithUniqueSlug() {
        when(categoryRepository.existsByNameIgnoreCase("Conseils")).thenReturn(false);
        when(slugService.uniqueSlug(any(), any())).thenReturn("conseils");
        when(categoryRepository.save(any(BlogCategory.class))).thenAnswer(invocation -> {
            BlogCategory saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        var response = service.createCategory(new BlogCategoryRequest("  Conseils  ", "  Guide premium  "));

        assertThat(response.name()).isEqualTo("Conseils");
        assertThat(response.slug()).isEqualTo("conseils");
        assertThat(response.description()).isEqualTo("Guide premium");
    }

    @Test
    void createCategoryRejectsDuplicateAndNormalizesBlankDescription() {
        when(categoryRepository.existsByNameIgnoreCase("Conseils")).thenReturn(true);

        assertThatThrownBy(() -> service.createCategory(new BlogCategoryRequest("Conseils", "")))
                .isInstanceOf(ResourceConflictException.class);

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void updatesCategoryAndRejectsConflictingRename() {
        BlogCategory category = category(1L, "Conseils", "conseils", "Old");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.existsByNameIgnoreCase("Actualites")).thenReturn(false);

        var response = service.updateCategory(1L, new BlogCategoryRequest(" Actualites ", " "));

        assertThat(response.name()).isEqualTo("Actualites");
        assertThat(response.description()).isNull();

        category.setName("Conseils");
        when(categoryRepository.existsByNameIgnoreCase("Actualites")).thenReturn(true);
        assertThatThrownBy(() -> service.updateCategory(
                1L, new BlogCategoryRequest("Actualites", "Description")
        )).isInstanceOf(ResourceConflictException.class);
    }

    @Test
    void deleteCategoryProtectsReferencesAndMissingRows() {
        when(postRepository.existsByCategoryId(1L)).thenReturn(true);
        assertThatThrownBy(() -> service.deleteCategory(1L)).isInstanceOf(ResourceConflictException.class);

        when(postRepository.existsByCategoryId(2L)).thenReturn(false);
        when(categoryRepository.existsById(2L)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteCategory(2L)).isInstanceOf(ResourceNotFoundException.class);

        when(postRepository.existsByCategoryId(3L)).thenReturn(false);
        when(categoryRepository.existsById(3L)).thenReturn(true);
        service.deleteCategory(3L);
        verify(categoryRepository).deleteById(3L);
    }

    @Test
    void createsUpdatesAndDeletesTags() {
        when(tagRepository.existsByNameIgnoreCase("Minimalisme")).thenReturn(false);
        when(slugService.uniqueSlug(any(), any())).thenReturn("minimalisme");
        when(tagRepository.save(any(BlogTag.class))).thenAnswer(invocation -> {
            BlogTag saved = invocation.getArgument(0);
            saved.setId(4L);
            return saved;
        });

        var created = service.createTag(new BlogTagRequest(" Minimalisme "));
        assertThat(created.slug()).isEqualTo("minimalisme");

        BlogTag tag = tag(4L, "Minimalisme", "minimalisme");
        when(tagRepository.findById(4L)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByNameIgnoreCase("Essentiels")).thenReturn(false);
        assertThat(service.updateTag(4L, new BlogTagRequest(" Essentiels ")).name())
                .isEqualTo("Essentiels");

        when(postRepository.existsByTagsId(4L)).thenReturn(false);
        when(tagRepository.existsById(4L)).thenReturn(true);
        service.deleteTag(4L);
        verify(tagRepository).deleteById(4L);
    }

    @Test
    void tagOperationsRejectDuplicatesReferencesAndMissingRows() {
        when(tagRepository.existsByNameIgnoreCase("Mode")).thenReturn(true);
        assertThatThrownBy(() -> service.createTag(new BlogTagRequest("Mode")))
                .isInstanceOf(ResourceConflictException.class);

        when(tagRepository.findById(8L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateTag(8L, new BlogTagRequest("Mode")))
                .isInstanceOf(ResourceNotFoundException.class);

        when(postRepository.existsByTagsId(9L)).thenReturn(true);
        assertThatThrownBy(() -> service.deleteTag(9L)).isInstanceOf(ResourceConflictException.class);

        when(postRepository.existsByTagsId(10L)).thenReturn(false);
        when(tagRepository.existsById(10L)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteTag(10L)).isInstanceOf(ResourceNotFoundException.class);
    }

    private BlogCategory category(Long id, String name, String slug, String description) {
        BlogCategory category = new BlogCategory();
        category.setId(id);
        category.setName(name);
        category.setSlug(slug);
        category.setDescription(description);
        return category;
    }

    private BlogTag tag(Long id, String name, String slug) {
        BlogTag tag = new BlogTag();
        tag.setId(id);
        tag.setName(name);
        tag.setSlug(slug);
        return tag;
    }
}
