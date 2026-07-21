package com.boutique.ecommerce.blog.entity;

import com.boutique.ecommerce.common.AuditableEntity;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.user.entity.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "blog_posts")
@Getter
@Setter
@NoArgsConstructor
public class BlogPost extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 220)
    private String title;

    @Column(nullable = false, length = 240, unique = true)
    private String slug;

    @Column(nullable = false, length = 600)
    private String excerpt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_json", nullable = false, columnDefinition = "jsonb")
    private String contentJson;

    @Column(name = "content_html", columnDefinition = "text")
    private String contentHtml;

    @Column(name = "cover_image_key", length = 500)
    private String coverImageKey;

    @Column(name = "cover_image_url", columnDefinition = "text")
    private String coverImageUrl;

    @Column(name = "cover_image_alt", length = 220)
    private String coverImageAlt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BlogPostStatus status = BlogPostStatus.DRAFT;

    @Column(nullable = false)
    private boolean featured;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private AppUser author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private BlogCategory category;

    @ManyToMany
    @JoinTable(name = "blog_post_tags", joinColumns = @JoinColumn(name = "post_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<BlogTag> tags = new LinkedHashSet<>();

    @ManyToMany
    @JoinTable(name = "blog_post_products", joinColumns = @JoinColumn(name = "post_id"), inverseJoinColumns = @JoinColumn(name = "product_id"))
    private Set<Product> products = new LinkedHashSet<>();

    @Column(name = "seo_title", length = 220)
    private String seoTitle;

    @Column(name = "meta_description", length = 320)
    private String metaDescription;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;
}
