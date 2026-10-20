package com.boutique.ecommerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.boutique.ecommerce.blog.dto.BlogPostRequest;
import com.boutique.ecommerce.blog.dto.BlogScheduleRequest;
import com.boutique.ecommerce.blog.entity.BlogCategory;
import com.boutique.ecommerce.blog.entity.BlogPostStatus;
import com.boutique.ecommerce.blog.repository.BlogCategoryRepository;
import com.boutique.ecommerce.blog.service.BlogPostService;
import com.boutique.ecommerce.category.entity.Category;
import com.boutique.ecommerce.category.repository.CategoryRepository;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.security.jwt.JwtService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.entity.Role;
import com.boutique.ecommerce.user.entity.RoleName;
import com.boutique.ecommerce.user.repository.RoleRepository;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@AutoConfigureMockMvc
class BlogIntegrationTest extends PostgresIntegrationTestBase {
    @Autowired private MockMvc mockMvc;
    @Autowired private BlogPostService postService;
    @Autowired private BlogCategoryRepository categoryRepository;
    @Autowired private CategoryRepository productCategoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private JwtService jwtService;

    private AppUser admin;
    private AppUser customer;
    private BlogCategory category;

    @BeforeEach
    void prepare() {
        admin = createUser(RoleName.ADMIN);
        customer = createUser(RoleName.USER);
        category = new BlogCategory();
        category.setName("Conseils " + UUID.randomUUID());
        category.setSlug("conseils-" + UUID.randomUUID());
        category.setDescription("Conseils éditoriaux ShopSphere");
        category = categoryRepository.save(category);
    }

    @Test
    void onlyPublishedAndDuePostsArePublic() throws Exception {
        var published = postService.create(request("Guide monochrome"), authentication(admin));
        postService.publish(published.id());
        var scheduled = postService.create(request("Guide programmé"), authentication(admin));
        postService.schedule(scheduled.id(), new BlogScheduleRequest(LocalDateTime.now().plusDays(1)));
        var draft = postService.create(request("Guide brouillon"), authentication(admin));

        mockMvc.perform(get("/api/blog/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].slug").value(published.slug()));
        mockMvc.perform(get("/api/blog/posts/{slug}", draft.slug()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/blog/posts/{slug}", scheduled.slug()))
                .andExpect(status().isNotFound());
    }

    @Test
    void scheduledPublicationBecomesPublicOnlyWhenDue() {
        var post = postService.create(request("Publication automatique"), authentication(admin));
        postService.schedule(post.id(), new BlogScheduleRequest(LocalDateTime.now().minusMinutes(1)));

        postService.publishScheduledPosts();

        assertThat(postService.adminPost(post.id()).status()).isEqualTo(BlogPostStatus.PUBLISHED);
        assertThat(postService.publicPost(post.slug()).id()).isEqualTo(post.id());
    }

    @Test
    void duplicateTitlesReceiveUniqueSlugs() {
        var first = postService.create(request("Élégance quotidienne"), authentication(admin));
        var second = postService.create(request("Élégance quotidienne"), authentication(admin));

        assertThat(first.slug()).isEqualTo("elegance-quotidienne");
        assertThat(second.slug()).isEqualTo("elegance-quotidienne-2");
    }

    @Test
    void adminEndpointsRequireAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/blog/posts"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/blog/posts").header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/blog/posts").header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk());
    }

    @Test
    void sitemapContainsPublishedArticleAndExcludesDraft() throws Exception {
        var published = postService.create(request("Article sitemap"), authentication(admin));
        postService.publish(published.id());
        var draft = postService.create(request("Brouillon sitemap"), authentication(admin));

        mockMvc.perform(get("/api/blog/sitemap.xml"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String xml = result.getResponse().getContentAsString();
                    assertThat(xml).contains("/blog/" + published.slug());
                    assertThat(xml).doesNotContain("/blog/" + draft.slug());
                });
    }

    @Test
    void publicSearchIsPaginatedAndReturnsAssociatedProducts() throws Exception {
        String marker = UUID.randomUUID().toString();
        Category productCategory = productCategoryRepository.save(Category.builder()
                .name("Blog products " + marker)
                .description("Test category")
                .active(true)
                .build());
        Product product = productRepository.save(Product.builder()
                .name("Produit blog " + marker)
                .description("Produit associé à un article")
                .price(new BigDecimal("149.90"))
                .stockQuantity(5)
                .sku("BLOG-" + marker)
                .status(ProductStatus.ACTIVE)
                .category(productCategory)
                .build());

        BlogPostRequest firstRequest = request("Recherche spéciale " + marker, Set.of(product.getId()));
        var first = postService.create(firstRequest, authentication(admin));
        postService.publish(first.id());
        var second = postService.create(request("Recherche spéciale suite " + marker), authentication(admin));
        postService.publish(second.id());

        mockMvc.perform(get("/api/blog/posts").param("search", marker).param("page", "0").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content.length()").value(1));
        mockMvc.perform(get("/api/blog/posts/{slug}", first.slug()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products[0].id").value(product.getId()))
                .andExpect(jsonPath("$.products[0].name").value(product.getName()));
    }

    private BlogPostRequest request(String title) {
        return request(title, Set.of());
    }

    private BlogPostRequest request(String title, Set<Long> productIds) {
        return new BlogPostRequest(
                title,
                null,
                "Un résumé éditorial suffisamment descriptif.",
                "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\"}]}",
                "<h2>Introduction</h2><p>Un contenu éditorial ShopSphere sécurisé.</p>",
                null,
                null,
                null,
                category.getId(),
                Set.of(),
                productIds,
                title + " | ShopSphere",
                "Conseils ShopSphere pour une sélection quotidienne."
        );
    }

    private AppUser createUser(RoleName roleName) {
        Role role = roleRepository.findByName(roleName).orElseThrow();
        String suffix = UUID.randomUUID().toString();
        return userRepository.save(AppUser.builder()
                .fullName(roleName + " blog user")
                .email(roleName.name().toLowerCase() + "-blog-" + suffix + "@example.com")
                .phone("+2126" + Math.abs(suffix.hashCode() % 100000000))
                .password("encoded-password-not-required")
                .enabled(true)
                .roles(Set.of(role))
                .build());
    }

    private UsernamePasswordAuthenticationToken authentication(AppUser user) {
        return new UsernamePasswordAuthenticationToken(user.getEmail(), "n/a");
    }

    private String bearer(AppUser user) {
        return "Bearer " + jwtService.generateAccessToken(jwtService.toUserDetails(user));
    }
}
