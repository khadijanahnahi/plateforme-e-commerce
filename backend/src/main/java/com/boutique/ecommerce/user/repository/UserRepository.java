package com.boutique.ecommerce.user.repository;

import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.user.dto.AdminCustomerResponse;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.entity.RoleName;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
            select new com.boutique.ecommerce.user.dto.AdminCustomerResponse(
                u.id,
                u.fullName,
                u.email,
                u.phone,
                u.enabled,
                u.createdAt,
                count(o.id),
                coalesce(sum(case when o.status <> :cancelledStatus then o.totalAmount else 0 end), 0)
            )
            from AppUser u
            join u.roles r
            left join Order o on o.user = u
            where r.name = :customerRole
            group by u.id, u.fullName, u.email, u.phone, u.enabled, u.createdAt
            order by u.createdAt desc
            """)
    List<AdminCustomerResponse> findAdminCustomers(
            @Param("customerRole") RoleName customerRole,
            @Param("cancelledStatus") OrderStatus cancelledStatus
    );
}
