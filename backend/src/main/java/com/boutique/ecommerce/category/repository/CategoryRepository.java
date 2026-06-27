package com.boutique.ecommerce.category.repository;

import com.boutique.ecommerce.category.entity.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByNameIgnoreCase(String name);

    Optional<Category> findByIdAndActiveTrue(Long id);

    List<Category> findByActiveTrueOrderByNameAsc();

    List<Category> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
