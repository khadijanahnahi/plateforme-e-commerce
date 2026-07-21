package com.boutique.ecommerce.blog.repository;

import com.boutique.ecommerce.blog.entity.BlogPost;
import com.boutique.ecommerce.blog.entity.BlogPostStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
    boolean existsByCategoryId(Long categoryId);
    boolean existsByTagsId(Long tagId);
    boolean existsByProductsId(Long productId);

    @EntityGraph(attributePaths = {"author", "category"})
    @Query("""
            select distinct p from BlogPost p
            left join p.tags t
            where p.status = com.boutique.ecommerce.blog.entity.BlogPostStatus.PUBLISHED
              and p.publishedAt <= :now
              and (:search is null or lower(p.title) like :search or lower(p.excerpt) like :search)
              and (:categorySlug is null or p.category.slug = :categorySlug)
              and (:tagSlug is null or t.slug = :tagSlug)
            """)
    Page<BlogPost> findPublicPosts(
            @Param("now") LocalDateTime now,
            @Param("search") String search,
            @Param("categorySlug") String categorySlug,
            @Param("tagSlug") String tagSlug,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"author", "category", "tags", "products"})
    @Query("""
            select distinct p from BlogPost p
            where p.slug = :slug
              and p.status = com.boutique.ecommerce.blog.entity.BlogPostStatus.PUBLISHED
              and p.publishedAt <= :now
            """)
    Optional<BlogPost> findPublicBySlug(@Param("slug") String slug, @Param("now") LocalDateTime now);

    @EntityGraph(attributePaths = {"author", "category"})
    @Query("""
            select distinct p from BlogPost p
            where p.status = com.boutique.ecommerce.blog.entity.BlogPostStatus.PUBLISHED
              and p.publishedAt <= :now and p.featured = true
            order by p.publishedAt desc
            """)
    List<BlogPost> findFeatured(@Param("now") LocalDateTime now, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "category"})
    @Query("""
            select distinct p from BlogPost p
            where (:status is null or p.status = :status)
              and (:search is null or lower(p.title) like :search or lower(p.slug) like :search)
            """)
    Page<BlogPost> findAdminPosts(
            @Param("status") BlogPostStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"author", "category", "tags", "products"})
    @Query("select distinct p from BlogPost p where p.id = :id")
    Optional<BlogPost> findDetailedById(@Param("id") Long id);

    List<BlogPost> findByStatusAndPublishedAtLessThanEqual(BlogPostStatus status, LocalDateTime now);

    List<BlogPost> findAllByStatusAndPublishedAtLessThanEqualOrderByPublishedAtDesc(
            BlogPostStatus status,
            LocalDateTime now
    );
}
