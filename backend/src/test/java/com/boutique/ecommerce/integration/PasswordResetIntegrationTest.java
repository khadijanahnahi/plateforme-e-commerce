package com.boutique.ecommerce.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.boutique.ecommerce.auth.dto.ForgotPasswordRequest;
import com.boutique.ecommerce.auth.dto.MessageResponse;
import com.boutique.ecommerce.auth.dto.ResetPasswordRequest;
import com.boutique.ecommerce.auth.entity.PasswordResetToken;
import com.boutique.ecommerce.auth.repository.PasswordResetTokenRepository;
import com.boutique.ecommerce.auth.service.PasswordResetService;
import com.boutique.ecommerce.notification.EmailService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@TestPropertySource(properties = "app.email.enabled=true")
class PasswordResetIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired private PasswordResetService passwordResetService;
    @Autowired private PasswordResetTokenRepository tokenRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @MockBean private EmailService emailService;

    private AppUser user;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString();
        user = userRepository.save(AppUser.builder()
                .fullName("Password Customer")
                .email("password-" + suffix + "@example.com")
                .phone("+212600000004")
                .password(passwordEncoder.encode("OldPassword1"))
                .enabled(true)
                .build());
        when(emailService.isConfigured()).thenReturn(true);
    }

    @Test
    void existingAndUnknownEmailsReceiveTheSameGenericResponse() throws Exception {
        MessageResponse existing = passwordResetService.requestPasswordReset(new ForgotPasswordRequest(user.getEmail()));
        MessageResponse unknown = passwordResetService.requestPasswordReset(
                new ForgotPasswordRequest("unknown-" + UUID.randomUUID() + "@example.com"));

        assertThat(existing.message()).isEqualTo(unknown.message());
        assertThat(existing.message()).startsWith("Si un compte existe");
        assertThat(tokenRepository.findAll()).hasSize(1);
        verify(emailService).sendHtml(
                eq(user.getEmail()),
                contains("Reinitialisation"),
                contains("/reset-password?token="));
    }

    @Test
    void validTokenChangesPasswordAndCannotBeReused() {
        passwordResetService.requestPasswordReset(new ForgotPasswordRequest(user.getEmail()));
        PasswordResetToken token = tokenRepository.findAll().get(0);

        passwordResetService.resetPassword(new ResetPasswordRequest(
                token.getToken(), "NewPassword2", "NewPassword2"));

        AppUser updated = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("OldPassword1", updated.getPassword())).isFalse();
        assertThat(passwordEncoder.matches("NewPassword2", updated.getPassword())).isTrue();
        assertThat(tokenRepository.findById(token.getId()).orElseThrow().isUsed()).isTrue();
        assertThatThrownBy(() -> passwordResetService.resetPassword(new ResetPasswordRequest(
                token.getToken(), "AnotherPassword3", "AnotherPassword3")))
                .hasMessageContaining("invalide ou expire");
    }

    @Test
    void expiredTokenIsRejected() {
        passwordResetService.requestPasswordReset(new ForgotPasswordRequest(user.getEmail()));
        PasswordResetToken token = tokenRepository.findAll().get(0);
        token.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        tokenRepository.flush();

        assertThatThrownBy(() -> passwordResetService.resetPassword(new ResetPasswordRequest(
                token.getToken(), "NewPassword2", "NewPassword2")))
                .hasMessageContaining("invalide ou expire");
        assertThat(passwordEncoder.matches("OldPassword1", userRepository.findById(user.getId()).orElseThrow().getPassword()))
                .isTrue();
    }

    @Test
    void unknownEmailDoesNotSendAnEmailOrCreateAToken() throws Exception {
        passwordResetService.requestPasswordReset(
                new ForgotPasswordRequest("missing-" + UUID.randomUUID() + "@example.com"));

        assertThat(tokenRepository.findAll()).isEmpty();
        verify(emailService, never()).sendHtml(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString());
    }
}
