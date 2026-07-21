package com.boutique.ecommerce.product.repository;

import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByStatus(ProductStatus status);

    Optional<Product> findBySku(String sku);

    Optional<Product> findBySkuIgnoreCase(String sku);

    Optional<Product> findByIdAndStatusIn(Long id, Collection<ProductStatus> statuses);

    long countByStatus(ProductStatus status);

    long countByCategoryId(Long categoryId);

    @Query("""
            select p
            from Product p
            join fetch p.category c
            where p.status in :statuses
              and (:categoryId is null or c.id = :categoryId)
            order by p.createdAt desc
            """)
    List<Product> findVisibleProducts(
            @Param("statuses") Collection<ProductStatus> statuses,
            @Param("categoryId") Long categoryId
    );

    @Query(
            value = """
                    select p
                    from Product p
                    join fetch p.category c
                    where p.status in :statuses
                      and (:categoryId is null or c.id = :categoryId)
                    order by p.createdAt desc
                    """,
            countQuery = """
                    select count(p)
                    from Product p
                    join p.category c
                    where p.status in :statuses
                      and (:categoryId is null or c.id = :categoryId)
                    """
    )
    Page<Product> findVisibleProductsPage(
            @Param("statuses") Collection<ProductStatus> statuses,
            @Param("categoryId") Long categoryId,
            Pageable pageable
    );

    @Query("""
            select p
            from Product p
            join fetch p.category c
            where p.status in :statuses
              and (:categoryId is null or c.id = :categoryId)
              and (
                    lower(p.name) like :searchPattern
                    or lower(coalesce(p.description, '')) like :searchPattern
                    or lower(coalesce(p.sku, '')) like :searchPattern
                  )
            order by p.createdAt desc
            """)
    List<Product> searchVisibleProducts(
            @Param("statuses") Collection<ProductStatus> statuses,
            @Param("searchPattern") String searchPattern,
            @Param("categoryId") Long categoryId
    );

    @Query(
            value = """
                    select p
                    from Product p
                    join fetch p.category c
                    where p.status in :statuses
                      and (:categoryId is null or c.id = :categoryId)
                      and (
                            lower(p.name) like :searchPattern
                            or lower(coalesce(p.description, '')) like :searchPattern
                            or lower(coalesce(p.sku, '')) like :searchPattern
                          )
                    order by p.createdAt desc
                    """,
            countQuery = """
                    select count(p)
                    from Product p
                    join p.category c
                    where p.status in :statuses
                      and (:categoryId is null or c.id = :categoryId)
                      and (
                            lower(p.name) like :searchPattern
                            or lower(coalesce(p.description, '')) like :searchPattern
                            or lower(coalesce(p.sku, '')) like :searchPattern
                          )
                    """
    )
    Page<Product> searchVisibleProductsPage(
            @Param("statuses") Collection<ProductStatus> statuses,
            @Param("searchPattern") String searchPattern,
            @Param("categoryId") Long categoryId,
            Pageable pageable
    );

    @Query("""
            select p
            from Product p
            join fetch p.category c
            where p.status in :statuses
              and c.active = true
              and (
                    lower(p.name) like :containsPattern
                    or lower(coalesce(p.sku, '')) like :containsPattern
                    or lower(c.name) like :containsPattern
                  )
            order by
              case
                when lower(p.name) = :normalizedQuery then 0
                when lower(p.name) like :prefixPattern then 1
                when lower(coalesce(p.sku, '')) = :normalizedQuery then 2
                when lower(coalesce(p.sku, '')) like :prefixPattern then 3
                when lower(c.name) like :prefixPattern then 4
                else 5
              end,
              p.name asc
            """)
    List<Product> findSearchSuggestions(
            @Param("statuses") Collection<ProductStatus> statuses,
            @Param("normalizedQuery") String normalizedQuery,
            @Param("prefixPattern") String prefixPattern,
            @Param("containsPattern") String containsPattern,
            Pageable pageable
    );

    @Query("""
            select p
            from Product p
            join fetch p.category c
            where (:categoryId is null or c.id = :categoryId)
            order by p.createdAt desc
            """)
    List<Product> findProductsForAdmin(@Param("categoryId") Long categoryId);

    @Query("""
            select p
            from Product p
            join fetch p.category c
            where (:categoryId is null or c.id = :categoryId)
              and (
                    lower(p.name) like :searchPattern
                    or lower(coalesce(p.description, '')) like :searchPattern
                    or lower(coalesce(p.sku, '')) like :searchPattern
                  )
            order by p.createdAt desc
            """)
    List<Product> searchProductsForAdmin(
            @Param("searchPattern") String searchPattern,
            @Param("categoryId") Long categoryId
    );

    boolean existsBySku(String sku);
}
