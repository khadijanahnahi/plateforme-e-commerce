package com.boutique.ecommerce.config;

import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.entity.Role;
import com.boutique.ecommerce.user.entity.RoleName;
import com.boutique.ecommerce.user.repository.RoleRepository;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminSeedProperties adminSeedProperties;

    public DataInitializer(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AdminSeedProperties adminSeedProperties
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminSeedProperties = adminSeedProperties;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedAdminAccount();
    }

    private void seedRoles() {
        for (RoleName roleName : EnumSet.allOf(RoleName.class)) {
            roleRepository.findByName(roleName)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));
        }
    }

    private void seedAdminAccount() {
        if (!adminSeedProperties.isEnabled()
                || isBlank(adminSeedProperties.getEmail())
                || isBlank(adminSeedProperties.getPassword())) {
            return;
        }

        String normalizedEmail = adminSeedProperties.getEmail().trim().toLowerCase();
        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role is missing."));

        AppUser existingAdmin = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (existingAdmin != null) {
            resetExistingAdminPassword(existingAdmin, adminRole);
            return;
        }

        AppUser admin = AppUser.builder()
                .fullName(defaultIfBlank(adminSeedProperties.getFullName(), "ShopSphere Admin"))
                .email(normalizedEmail)
                .phone(defaultIfBlank(adminSeedProperties.getPhone(), "+212600000000"))
                .password(passwordEncoder.encode(adminSeedProperties.getPassword()))
                .enabled(true)
                .roles(Set.of(adminRole))
                .build();

        userRepository.save(admin);
    }

    private void resetExistingAdminPassword(AppUser admin, Role adminRole) {
        if (!adminSeedProperties.isResetPassword()) {
            return;
        }

        admin.setPassword(passwordEncoder.encode(adminSeedProperties.getPassword()));
        admin.setEnabled(true);
        Set<Role> roles = new HashSet<>(admin.getRoles());
        roles.add(adminRole);
        admin.setRoles(roles);
        userRepository.save(admin);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String defaultIfBlank(String value, String fallback) {
        return isBlank(value) ? fallback : value.trim();
    }
}
