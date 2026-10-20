package com.boutique.ecommerce.blog.service;

import com.boutique.ecommerce.blog.dto.BlogFeatureRequest;
import com.boutique.ecommerce.blog.dto.BlogPostRequest;
import com.boutique.ecommerce.blog.dto.BlogPostResponse;
import com.boutique.ecommerce.blog.dto.BlogPostSummaryResponse;
import com.boutique.ecommerce.blog.dto.BlogScheduleRequest;
import com.boutique.ecommerce.blog.entity.BlogCategory;
import com.boutique.ecommerce.blog.entity.BlogPost;
import com.boutique.ecommerce.blog.entity.BlogPostStatus;
import com.boutique.ecommerce.blog.entity.BlogTag;
import com.boutique.ecommerce.blog.repository.BlogCategoryRepository;
import com.boutique.ecommerce.blog.repository.BlogPostRepository;
import com.boutique.ecommerce.blog.repository.BlogTagRepository;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.product.dto.ProductResponse;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.product.service.ProductService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlogPostService {
    private static final Set<String> ALLOWED_SORTS = Set.of("publishedAt", "createdAt", "title", "updatedAt");
    private final BlogPostRepository postRepository;
    private final BlogCategoryRepository categoryRepository;
    private final BlogTagRepository tagRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final UserRepository userRepository;
    private final BlogSlugService slugService;
    private final BlogContentService contentService;
    private final BlogTaxonomyService taxonomyService;
    private final BlogMediaStorageService mediaStorageService;

    public BlogPostService(BlogPostRepository postRepository, BlogCategoryRepository categoryRepository,
                           BlogTagRepository tagRepository, ProductRepository productRepository,
                           ProductService productService, UserRepository userRepository, BlogSlugService slugService,
                           BlogContentService contentService, BlogTaxonomyService taxonomyService,
                           BlogMediaStorageService mediaStorageService) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.productRepository = productRepository;
        this.productService = productService;
        this.userRepository = userRepository;
        this.slugService = slugService;
        this.contentService = contentService;
        this.taxonomyService = taxonomyService;
        this.mediaStorageService = mediaStorageService;
    }

    @Transactional(readOnly = true)
    public Page<BlogPostSummaryResponse> publicPosts(String search, String category, String tag, int page, int size, String sort) {
        Pageable pageable = pageRequest(page, size, sort, Sort.Direction.DESC);
        return postRepository.findPublicPosts(LocalDateTime.now(), pattern(search), normalize(category), normalize(tag), pageable)
                .map(this::summary);
    }

    @Transactional(readOnly = true)
    public BlogPostResponse publicPost(String slug) {
        BlogPost post = postRepository.findPublicBySlug(slug, LocalDateTime.now())
                .orElseThrow(() -> new ResourceNotFoundException("Published blog post not found."));
        return detail(post, true);
    }

    @Transactional(readOnly = true)
    public List<BlogPostSummaryResponse> featured(int limit) {
        return postRepository.findFeatured(LocalDateTime.now(), PageRequest.of(0, clampSize(limit, 1, 12)))
                .stream().map(this::summary).toList();
    }

    @Transactional(readOnly = true)
    public List<BlogPostSummaryResponse> latest(int limit) {
        return publicPosts(null, null, null, 0, clampSize(limit, 1, 12), "publishedAt").getContent();
    }

    @Transactional(readOnly = true)
    public Page<BlogPostSummaryResponse> adminPosts(String search, BlogPostStatus status, int page, int size, String sort) {
        return postRepository.findAdminPosts(status, pattern(search), pageRequest(page, size, sort, Sort.Direction.DESC)).map(this::summary);
    }

    @Transactional(readOnly = true)
    public BlogPostResponse adminPost(Long id) {
        return detail(findDetailed(id), false);
    }

    @Transactional
    public BlogPostResponse create(BlogPostRequest request, Authentication authentication) {
        BlogPost post = new BlogPost();
        post.setAuthor(currentUser(authentication));
        post.setSlug(slugService.uniqueSlug(request.slug() == null || request.slug().isBlank() ? request.title() : request.slug(), postRepository::existsBySlug));
        apply(post, request, false);
        return detail(postRepository.save(post), false);
    }

    @Transactional
    public BlogPostResponse update(Long id, BlogPostRequest request) {
        BlogPost post = findDetailed(id);
        String previousImage = post.getCoverImageKey();
        if (request.slug() != null && !request.slug().isBlank()) {
            String requestedSlug = slugService.slugify(request.slug());
            if (!requestedSlug.equals(post.getSlug()) && postRepository.existsBySlugAndIdNot(requestedSlug, id)) {
                requestedSlug = slugService.uniqueSlug(requestedSlug, postRepository::existsBySlug);
            }
            post.setSlug(requestedSlug);
        } else if (post.getStatus() == BlogPostStatus.DRAFT && !post.getTitle().equals(request.title().trim())) {
            post.setSlug(slugService.uniqueSlug(request.title(), candidate -> postRepository.existsBySlugAndIdNot(candidate, id)));
        }
        apply(post, request, true);
        if (previousImage != null && !previousImage.equals(post.getCoverImageKey())) mediaStorageService.delete(previousImage);
        return detail(post, false);
    }

    @Transactional
    public BlogPostResponse publish(Long id) {
        BlogPost post = findDetailed(id);
        validatePublishable(post);
        post.setStatus(BlogPostStatus.PUBLISHED);
        if (post.getPublishedAt() == null || post.getPublishedAt().isAfter(LocalDateTime.now())) post.setPublishedAt(LocalDateTime.now());
        return detail(post, false);
    }

    @Transactional
    public BlogPostResponse schedule(Long id, BlogScheduleRequest request) {
        BlogPost post = findDetailed(id);
        validatePublishable(post);
        post.setStatus(BlogPostStatus.SCHEDULED);
        post.setPublishedAt(request.publishedAt());
        return detail(post, false);
    }

    @Transactional
    public BlogPostResponse archive(Long id) {
        BlogPost post = findDetailed(id);
        post.setStatus(BlogPostStatus.ARCHIVED);
        post.setFeatured(false);
        return detail(post, false);
    }

    @Transactional
    public BlogPostResponse feature(Long id, BlogFeatureRequest request) {
        BlogPost post = findDetailed(id);
        if (request.featured() && post.getStatus() != BlogPostStatus.PUBLISHED) {
            throw new IllegalArgumentException("Only published posts can be featured.");
        }
        post.setFeatured(request.featured());
        return detail(post, false);
    }

    @Transactional
    public void delete(Long id) {
        BlogPost post = findDetailed(id);
        String coverKey = post.getCoverImageKey();
        postRepository.delete(post);
        if (coverKey != null) mediaStorageService.delete(coverKey);
    }

    @Scheduled(fixedDelayString = "${app.blog.schedule-check-ms:60000}")
    @Transactional
    public void publishScheduledPosts() {
        for (BlogPost post : postRepository.findByStatusAndPublishedAtLessThanEqual(BlogPostStatus.SCHEDULED, LocalDateTime.now())) {
            post.setStatus(BlogPostStatus.PUBLISHED);
        }
    }

    private void apply(BlogPost post, BlogPostRequest request, boolean update) {
        post.setTitle(request.title().trim());
        post.setExcerpt(request.excerpt().trim());
        post.setContentJson(contentService.validateJson(request.contentJson()));
        post.setContentHtml(contentService.sanitizeHtml(request.contentHtml()));
        post.setCoverImageKey(normalize(request.coverImageKey()));
        post.setCoverImageUrl(normalize(request.coverImageUrl()));
        post.setCoverImageAlt(normalize(request.coverImageAlt()));
        post.setSeoTitle(normalize(request.seoTitle()));
        post.setMetaDescription(normalize(request.metaDescription()));
        post.setCategory(resolveCategory(request.categoryId()));
        post.setTags(resolveTags(request.tagIds()));
        post.setProducts(resolveProducts(request.productIds()));
        if (!update) post.setStatus(BlogPostStatus.DRAFT);
    }

    private void validatePublishable(BlogPost post) {
        if (post.getContentHtml() == null || post.getContentHtml().isBlank()) throw new IllegalArgumentException("Post content is required before publication.");
        if (post.getCategory() == null) throw new IllegalArgumentException("A category is required before publication.");
    }

    private AppUser currentUser(Authentication authentication) {
        if (authentication == null) throw new IllegalArgumentException("Authenticated author is required.");
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Blog author not found."));
    }

    private BlogCategory resolveCategory(Long id) {
        return id == null ? null : categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Blog category not found."));
    }

    private Set<BlogTag> resolveTags(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return new LinkedHashSet<>();
        Set<BlogTag> tags = tagRepository.findByIdIn(ids);
        if (tags.size() != ids.size()) throw new ResourceNotFoundException("One or more blog tags were not found.");
        return new LinkedHashSet<>(tags);
    }

    private Set<Product> resolveProducts(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return new LinkedHashSet<>();
        List<Product> products = productRepository.findAllById(ids);
        if (products.size() != ids.size()) throw new ResourceNotFoundException("One or more related products were not found.");
        return new LinkedHashSet<>(products);
    }

    private BlogPost findDetailed(Long id) {
        return postRepository.findDetailedById(id).orElseThrow(() -> new ResourceNotFoundException("Blog post not found."));
    }

    private BlogPostSummaryResponse summary(BlogPost post) {
        return new BlogPostSummaryResponse(post.getId(), post.getTitle(), post.getSlug(), post.getExcerpt(),
                post.getCoverImageUrl(), post.getCoverImageAlt(), post.getStatus(), post.isFeatured(),
                authorName(post.getAuthor()), taxonomyService.toResponse(post.getCategory()),
                post.getTags().stream().sorted(Comparator.comparing(BlogTag::getName)).map(taxonomyService::toResponse).toList(),
                contentService.readingTimeMinutes(post.getContentHtml()), post.getPublishedAt(), post.getCreatedAt(), post.getUpdatedAt());
    }

    private BlogPostResponse detail(BlogPost post, boolean publicView) {
        List<ProductResponse> products = post.getProducts().stream()
                .filter(product -> !publicView || product.getStatus() == ProductStatus.ACTIVE || product.getStatus() == ProductStatus.OUT_OF_STOCK)
                .map(product -> publicView ? productService.getVisibleById(product.getId()) : productService.getByIdForAdmin(product.getId()))
                .toList();
        return new BlogPostResponse(post.getId(), post.getTitle(), post.getSlug(), post.getExcerpt(),
                publicView ? null : post.getContentJson(),
                post.getContentHtml(), publicView ? null : post.getCoverImageKey(), post.getCoverImageUrl(), post.getCoverImageAlt(),
                post.getStatus(), post.isFeatured(), authorName(post.getAuthor()), taxonomyService.toResponse(post.getCategory()),
                post.getTags().stream().sorted(Comparator.comparing(BlogTag::getName)).map(taxonomyService::toResponse).toList(), products,
                post.getSeoTitle(), post.getMetaDescription(), contentService.readingTimeMinutes(post.getContentHtml()),
                post.getPublishedAt(), post.getCreatedAt(), post.getUpdatedAt());
    }

    private Pageable pageRequest(int page, int size, String sort, Sort.Direction direction) {
        String safeSort = ALLOWED_SORTS.contains(sort) ? sort : "publishedAt";
        return PageRequest.of(Math.max(0, page), clampSize(size, 1, 50), Sort.by(direction, safeSort));
    }

    private int clampSize(int value, int min, int max) { return Math.max(min, Math.min(max, value)); }
    private String pattern(String value) { String normalized = normalize(value); return normalized == null ? null : "%" + normalized.toLowerCase() + "%"; }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String authorName(AppUser author) { return author == null ? "ShopSphere" : author.getFullName(); }
}
