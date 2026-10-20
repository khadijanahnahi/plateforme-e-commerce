package com.boutique.ecommerce.user.repository;

import com.boutique.ecommerce.user.entity.Role;
import com.boutique.ecommerce.user.entity.RoleName;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name);
}
