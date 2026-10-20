package com.boutique.ecommerce.blog.repository;

import com.boutique.ecommerce.blog.entity.BlogTag;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogTagRepository extends JpaRepository<BlogTag, Long> {
    Optional<BlogTag> findBySlug(String slug);
    boolean existsByNameIgnoreCase(String name);
    boolean existsBySlug(String slug);
    List<BlogTag> findAllByOrderByNameAsc();
    Set<BlogTag> findByIdIn(Set<Long> ids);
}
