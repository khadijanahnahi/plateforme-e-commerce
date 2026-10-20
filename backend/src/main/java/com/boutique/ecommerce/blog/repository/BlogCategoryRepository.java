package com.boutique.ecommerce.blog.repository;

import com.boutique.ecommerce.blog.entity.BlogCategory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogCategoryRepository extends JpaRepository<BlogCategory, Long> {
    Optional<BlogCategory> findBySlug(String slug);
    boolean existsByNameIgnoreCase(String name);
    boolean existsBySlug(String slug);
    List<BlogCategory> findAllByOrderByNameAsc();
}
