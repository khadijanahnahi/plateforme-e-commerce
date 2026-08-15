package com.boutique.ecommerce.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.boutique.ecommerce.auth.repository.RefreshTokenSessionRepository;
import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.security.jwt.JwtService;
import com.boutique.ecommerce.user.dto.UpdatePasswordRequest;
import com.boutique.ecommerce.user.dto.UpdateProfileRequest;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.entity.Role;
import com.boutique.ecommerce.user.entity.RoleName;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenSessionRepository refreshTokenSessionRepository;

    private UserProfileService service;
    private AppUser currentUser;

    @BeforeEach
    void setUp() {
        service = new UserProfileService(
                userRepository, passwordEncoder, jwtService, refreshTokenSessionRepository
        );
        currentUser = AppUser.builder()
                .id(7L)
                .fullName("Client ShopSphere")
                .email("client@shopsphere.ma")
                .phone("+212600000000")
                .password("encoded-old")
                .roles(Set.of(Role.builder().id(1L).name(RoleName.USER).build()))
                .build();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getProfileReturnsAuthenticatedUser() {
        authenticateCurrentUser();

        var response = service.getProfile();

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.email()).isEqualTo("client@shopsphere.ma");
        assertThat(response.roles()).containsExactly("USER");
    }

    @Test
    void getProfileRejectsAnonymousAndUnknownUsers() {
        assertThatThrownBy(service::getProfile)
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Authentication is required.");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("missing@shopsphere.ma", "password", Set.of())
        );
        when(userRepository.findByEmailIgnoreCase("missing@shopsphere.ma")).thenReturn(Optional.empty());

        assertThatThrownBy(service::getProfile)
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Authenticated user not found.");
    }

    @Test
    void updateProfileNormalizesDataAndReturnsFreshAccessToken() {
        authenticateCurrentUser();
        UserDetails details = User.withUsername("new@shopsphere.ma")
                .password("encoded-old")
                .authorities("ROLE_USER")
                .build();
        when(userRepository.findByEmailIgnoreCase("new@shopsphere.ma")).thenReturn(Optional.empty());
        when(jwtService.toUserDetails(currentUser)).thenReturn(details);
        when(jwtService.generateAccessToken(details)).thenReturn("new-access-token");
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(900_000L);

        var response = service.updateProfile(new UpdateProfileRequest(
                "  Nouveau Client  ", "  NEW@ShopSphere.ma ", " +212611111111 "
        ));

        assertThat(currentUser.getFullName()).isEqualTo("Nouveau Client");
        assertThat(currentUser.getEmail()).isEqualTo("new@shopsphere.ma");
        assertThat(currentUser.getPhone()).isEqualTo("+212611111111");
        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.user().roles()).containsExactly("USER");
    }

    @Test
    void updateProfileRejectsEmailOwnedByAnotherUser() {
        authenticateCurrentUser();
        AppUser otherUser = AppUser.builder().id(8L).email("used@shopsphere.ma").build();
        when(userRepository.findByEmailIgnoreCase("used@shopsphere.ma"))
                .thenReturn(Optional.of(otherUser));

        assertThatThrownBy(() -> service.updateProfile(new UpdateProfileRequest(
                "Client", "used@shopsphere.ma", "+212600000001"
        )))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessage("An account with this email already exists.");

        verify(jwtService, never()).generateAccessToken(any());
    }

    @Test
    void updatePasswordRejectsWrongPassword() {
        authenticateCurrentUser();
        when(passwordEncoder.matches("wrong", "encoded-old")).thenReturn(false);

        assertThatThrownBy(() -> service.updatePassword(new UpdatePasswordRequest("wrong", "NewPassword123!")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Current password is incorrect.");

        verify(passwordEncoder, never()).encode(any());
        verify(refreshTokenSessionRepository, never()).revokeActiveSessionsForUser(any(), any());
    }

    @Test
    void updatePasswordEncodesPasswordAndRevokesRefreshSessions() {
        authenticateCurrentUser();
        when(passwordEncoder.matches("OldPassword123!", "encoded-old")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword123!")).thenReturn("encoded-new");

        var response = service.updatePassword(
                new UpdatePasswordRequest("OldPassword123!", "NewPassword123!")
        );

        assertThat(currentUser.getPassword()).isEqualTo("encoded-new");
        assertThat(response.id()).isEqualTo(currentUser.getId());
        verify(refreshTokenSessionRepository)
                .revokeActiveSessionsForUser(eq(currentUser.getId()), any(LocalDateTime.class));
    }

    private void authenticateCurrentUser() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(currentUser.getEmail(), "password", Set.of())
        );
        when(userRepository.findByEmailIgnoreCase(currentUser.getEmail()))
                .thenReturn(Optional.of(currentUser));
    }
}
