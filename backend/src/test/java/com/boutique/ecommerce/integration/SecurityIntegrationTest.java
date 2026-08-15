package com.boutique.ecommerce.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.security.jwt.JwtService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.entity.Role;
import com.boutique.ecommerce.user.entity.RoleName;
import com.boutique.ecommerce.user.repository.RoleRepository;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@AutoConfigureMockMvc
class SecurityIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private JwtService jwtService;

    @Test
    void anonymousIsUnauthorizedOnProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/orders/my-orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userIsForbiddenAndAdminIsAllowedOnAdminEndpoints() throws Exception {
        AppUser user = createUser(RoleName.USER);
        AppUser admin = createUser(RoleName.ADMIN);

        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk());
    }

    @Test
    void customerCannotReadAnotherCustomersOrder() throws Exception {
        AppUser owner = createUser(RoleName.USER);
        AppUser otherCustomer = createUser(RoleName.USER);
        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase())
                .user(owner)
                .customerName(owner.getFullName())
                .customerEmail(owner.getEmail())
                .customerPhone(owner.getPhone())
                .subtotalAmount(new BigDecimal("50.00"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("50.00"))
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.UNPAID)
                .shippingAddress("Fes")
                .build());

        mockMvc.perform(get("/api/orders/{id}", order.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(otherCustomer)))
                .andExpect(status().isNotFound());
    }

    @Test
    void publicCatalogEndpointRemainsAccessible() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk());
    }

    @Test
    void stateChangingRequestRequiresCsrfToken() throws Exception {
        String invalidSupportRequest = "{}";

        mockMvc.perform(post("/api/support-messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidSupportRequest))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/support-messages")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidSupportRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    void csrfBootstrapPublishesTokenCookie() throws Exception {
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", true))
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    private AppUser createUser(RoleName roleName) {
        Role role = roleRepository.findByName(roleName).orElseThrow();
        String suffix = UUID.randomUUID().toString();
        return userRepository.save(AppUser.builder()
                .fullName(roleName + " integration user")
                .email(roleName.name().toLowerCase() + "-" + suffix + "@example.com")
                .phone("+212600000002")
                .password("encoded-password-not-required")
                .enabled(true)
                .roles(Set.of(role))
                .build());
    }

    private String bearer(AppUser user) {
        return "Bearer " + jwtService.generateAccessToken(jwtService.toUserDetails(user));
    }
}
