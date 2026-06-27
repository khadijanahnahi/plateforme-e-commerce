package com.boutique.ecommerce.product.repository;

import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByStatus(ProductStatus status);

    Optional<Product> findBySku(String sku);

    Optional<Product> findBySkuIgnoreCase(String sku);

    Optional<Product> findByIdAndStatusIn(Long id, Collection<ProductStatus> statuses);

    long countByStatus(ProductStatus status);

    @Query("""
            select p
            from Product p
            join fetch p.category c
            where p.status in :statuses
              and (:categoryId is null or c.id = :categoryId)
              and (
                    :search is null
                    or lower(p.name) like lower(concat('%', :search, '%'))
                    or lower(coalesce(p.description, '')) like lower(concat('%', :search, '%'))
                    or lower(coalesce(p.sku, '')) like lower(concat('%', :search, '%'))
                  )
            order by p.createdAt desc
            """)
    List<Product> findVisibleProducts(
            @Param("statuses") Collection<ProductStatus> statuses,
            @Param("search") String search,
            @Param("categoryId") Long categoryId
    );

    @Query("""
            select p
            from Product p
            join fetch p.category c
            where (:categoryId is null or c.id = :categoryId)
              and (
                    :search is null
                    or lower(p.name) like lower(concat('%', :search, '%'))
                    or lower(coalesce(p.description, '')) like lower(concat('%', :search, '%'))
                    or lower(coalesce(p.sku, '')) like lower(concat('%', :search, '%'))
                  )
            order by p.createdAt desc
            """)
    List<Product> findProductsForAdmin(
            @Param("search") String search,
            @Param("categoryId") Long categoryId
    );

    boolean existsBySku(String sku);
}
