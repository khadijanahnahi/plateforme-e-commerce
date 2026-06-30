package com.boutique.ecommerce.banner.repository;

import com.boutique.ecommerce.banner.entity.Banner;
import com.boutique.ecommerce.banner.entity.BannerPlacement;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BannerRepository extends JpaRepository<Banner, Long> {

    List<Banner> findAllByOrderByPriorityAscCreatedAtDesc();

    @Query("""
            select b
            from Banner b
            where b.placement = :placement
              and b.active = true
              and (b.startsAt is null or b.startsAt <= :now)
              and (b.endsAt is null or b.endsAt >= :now)
            order by b.priority asc, b.createdAt desc
            """)
    List<Banner> findPublicBanners(
            @Param("placement") BannerPlacement placement,
            @Param("now") LocalDateTime now
    );
}
